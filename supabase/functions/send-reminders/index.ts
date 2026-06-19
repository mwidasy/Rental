import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const landlordEmail = Deno.env.get('LANDLORD_EMAIL')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Rental Manager <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('Resend error:', text)
  }
}

Deno.serve(async () => {
  const today = new Date()
  const results: string[] = []

  // Fetch all active leases with tenant + unit + property info
  const { data: leases, error } = await supabase
    .from('leases')
    .select('*, tenants(full_name, email), units(unit_label, properties(name))')
    .eq('status', 'active')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  for (const lease of leases ?? []) {
    // --- Lease expiry check (within 30 days) ---
    const expiry = new Date(lease.lease_expiry)
    const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysToExpiry === 30 || daysToExpiry === 7 || daysToExpiry === 1) {
      const propertyLabel = `${lease.units.unit_label} — ${lease.units.properties.name}`

      if (lease.tenants.email) {
        await sendEmail(
          lease.tenants.email,
          `Lease Expiry Reminder: ${daysToExpiry} day(s) left`,
          `<p>Dear ${lease.tenants.full_name},</p><p>Your lease for ${propertyLabel} expires on ${lease.lease_expiry}. Please contact your landlord to renew.</p>`
        )
      }

      await sendEmail(
        landlordEmail,
        `Lease Expiry Alert: ${lease.tenants.full_name} — ${daysToExpiry} day(s) left`,
        `<p>${lease.tenants.full_name}'s lease for ${propertyLabel} expires on ${lease.lease_expiry}.</p>`
      )

      results.push(`Expiry reminder sent for lease ${lease.id}`)
    }

    // --- Rent due check (based on move_in_date's day-of-month) ---
    const moveInDay = new Date(lease.move_in_date).getDate()
    const dueDate = new Date(today.getFullYear(), today.getMonth(), moveInDay)
    const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysToDue === 3 || daysToDue === 0) {
      const propertyLabel = `${lease.units.unit_label} — ${lease.units.properties.name}`

      if (lease.tenants.email) {
        await sendEmail(
          lease.tenants.email,
          daysToDue === 0 ? 'Rent Due Today' : `Rent Due in ${daysToDue} Days`,
          `<p>Dear ${lease.tenants.full_name},</p><p>Your rent of TZS ${Number(lease.monthly_rent).toLocaleString()} for ${propertyLabel} is due ${daysToDue === 0 ? 'today' : `in ${daysToDue} days`}.</p>`
        )
      }

      await sendEmail(
        landlordEmail,
        `Rent Due Alert: ${lease.tenants.full_name}`,
        `<p>${lease.tenants.full_name}'s rent for ${propertyLabel} is due ${daysToDue === 0 ? 'today' : `in ${daysToDue} days`}.</p>`
      )

      results.push(`Rent reminder sent for lease ${lease.id}`)
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})