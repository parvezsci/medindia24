export default function Terms() {
  return (
    <main className="min-h-screen bg-bg p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 sm:p-10 space-y-5">
        <h1 className="text-3xl font-bold text-primary">Terms & Conditions</h1>
        <p className="text-sm text-textmuted">Last updated: October 2026</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">1. MedLink Kya Hai</h2>
          <p className="text-sm text-text">
            MedLink ek digital platform hai jo customers ko unke nazdiki registered, local
            medical stores (pharmacies) se connect karta hai. MedLink khud koi dawai nahi bechta,
            nahi stock karta, aur na hi kisi dawai ki quality, safety ya effectiveness ki
            guarantee deta hai. MedLink sirf ek <b>maध्यम (medium/facilitator)</b> hai jo order,
            communication aur payment process ko aasan banata hai.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">2. Medical Store Ki Zimmedari</h2>
          <p className="text-sm text-text">
            Har registered medical store independently licensed hai aur apne drug license ke
            tahat kaam karta hai. Prescription verify karna, dawai ki authenticity, expiry,
            storage, aur sahi dawai dena — ye sab <b>poori tarah medical store ki zimmedari</b>
            hai. MedLink in cheezon ko control ya verify nahi karta real-time me.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">3. Customer Ki Zimmedari</h2>
          <p className="text-sm text-text">
            Customer ye confirm karta hai ki jo prescription ya medicine request upload ki ja
            rahi hai, wo authentic hai aur qualified doctor dwara di gayi hai. Schedule H, H1
            aur X dawaiyon ke liye valid prescription dena zaroori hai. Galat ya fake prescription
            upload karna customer ki apni zimmedari aur risk par hai.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">4. MedLink Ki Limited Responsibility</h2>
          <p className="text-sm text-text">
            MedLink in cheezon ke liye zimmedar nahi hai: dawai ki quality/authenticity, galat
            dawai dena, prescription verification me chook, delivery me deri, payment dispute
            (jo seedha customer aur store ke beech UPI se hota hai), ya kisi bhi medical/health
            consequence jo dawai lene se ho. Koi bhi dispute customer aur medical store ke
            beech resolve hoga.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">5. Payment</h2>
          <p className="text-sm text-text">
            Payment customer dwara seedha medical store ke UPI ID/QR code par kiya jata hai.
            MedLink is transaction me koi commission nahi leta aur na hi payment hold/process
            karta hai. Payment se juda koi bhi dispute customer aur store ke beech hi resolve
            hoga.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">6. Account Suspension</h2>
          <p className="text-sm text-text">
            MedLink kisi bhi account (customer ya store) ko bina notice ke suspend/terminate
            kar sakta hai agar galat jaankari di gayi ho, fraud ka shaq ho, ya platform ka
            galat istemal ho raha ho.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">7. Changes to Terms</h2>
          <p className="text-sm text-text">
            Ye terms samay-samay par update ho sakte hain. Platform use karte rehna matlab
            aapne naye terms accept kar liye hain.
          </p>
        </section>

        <p className="text-sm text-textmuted pt-4 border-t border-accent">
          Koi sawal ho to humse contact karein: support@medlink.com
        </p>
      </div>
    </main>
  )
}