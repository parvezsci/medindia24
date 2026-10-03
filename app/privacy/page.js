export default function Privacy() {
  return (
    <main className="min-h-screen bg-bg p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 sm:p-10 space-y-5">
        <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
        <p className="text-sm text-textmuted">Last updated: October 2026</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">1. Hum Kya Data Lete Hain</h2>
          <p className="text-sm text-text">
            Naam, phone number, email, delivery address, prescription images, aur order
            history. Location (GPS) sirf nearby stores dhoondne ke liye use hoti hai.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">2. Data Ka Istemal</h2>
          <p className="text-sm text-text">
            Aapka data sirf order process karne, nearby stores se connect karne, aur
            platform behtar banane ke liye use hota hai. Prescription images sirf us order
            se jude medical store ko hi dikhti hain, kisi aur ko nahi.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">3. Data Sharing</h2>
          <p className="text-sm text-text">
            Hum aapka data kisi third-party advertiser ko nahi bechte. Sirf us medical store
            ke saath relevant order details share hoti hain jisko aapne order bheja hai.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">4. Data Security</h2>
          <p className="text-sm text-text">
            Prescription images private storage me rakhi jaati hain aur sirf authorized
            access (aap, aur jis store ko order bheja) ke paas hi dikhti hain.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">5. Aapke Rights</h2>
          <p className="text-sm text-text">
            Aap apna account aur data delete karne ki request kar sakte hain, humein
            support@medlink.com par likh kar.
          </p>
        </section>
      </div>
    </main>
  )
}