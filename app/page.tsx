'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Image from 'next/image'

export default function Home() {
  const [profile, setProfile] = useState<any>(null)
  const [checked, setChecked] = useState(false)
  const [stats, setStats] = useState({ stores: 0, orders: 0 })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
      setChecked(true)

      const { count: storeCount } = await supabase
        .from('stores').select('*', { count: 'exact', head: true }).eq('is_approved', true)
      const { count: orderCount } = await supabase
        .from('orders').select('*', { count: 'exact', head: true })
      setStats({ stores: storeCount || 0, orders: orderCount || 0 })
    }
    load()
  }, [])

  const ctaLink = !profile ? '/login'
    : profile.role === 'customer' ? '/order'
    : profile.role === 'store' ? '/store-profile'
    : '/dashboard'

  const ctaText = !profile ? 'Shuru Karo'
    : profile.role === 'customer' ? 'Order Place Karo'
    : profile.role === 'store' ? 'Store Profile Dekho'
    : 'Admin Panel Kholo'

  return (
    <main className="min-h-screen bg-bg">

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-4 pt-10 pb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-accent text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Aapke sheher ke registered chemists ke saath
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4 leading-tight">
              Apka Local Medical Store, Ab Digital
            </h1>
            <p className="text-textmuted text-lg mb-8">
              Prescription upload karo, apne nazdiki registered medical store se order karo,
              aur ghar baithe medicines pao — apka bharosemand chemist, ek click par.
            </p>
            {checked && (
              <a href={ctaLink} className="bg-primary text-white px-7 py-3.5 rounded-xl font-semibold inline-block hover:bg-secondary transition shadow-lg">
                {ctaText}
              </a>
            )}
          </div>
          <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/images/hero-pharmacy.jpg"
              alt="Local Pharmacy"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-4xl mx-auto grid grid-cols-2 gap-5 px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-accent/30">
          <p className="text-4xl font-bold text-primary">{stats.stores}+</p>
          <p className="text-sm text-textmuted mt-1">Registered Local Stores</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-accent/30">
          <p className="text-4xl font-bold text-primary">{stats.orders}+</p>
          <p className="text-sm text-textmuted mt-1">Orders Place Hue</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-primary text-center mb-12">Kaise Kaam Karta Hai</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-accent/20">
            <div className="relative h-48">
              <Image src="/images/step-upload.jpg" alt="Upload Prescription" fill className="object-cover" />
            </div>
            <div className="p-5 text-center">
              <div className="w-9 h-9 rounded-full bg-accent text-primary font-bold flex items-center justify-center mx-auto mb-3">1</div>
              <p className="font-semibold text-primary mb-1">Order Karo</p>
              <p className="text-sm text-textmuted">Prescription upload karo ya medicine ka naam likho</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-accent/20">
            <div className="relative h-48">
              <Image src="/images/step-confirm.jpg" alt="Store Confirm" fill className="object-cover" />
            </div>
            <div className="p-5 text-center">
              <div className="w-9 h-9 rounded-full bg-accent text-primary font-bold flex items-center justify-center mx-auto mb-3">2</div>
              <p className="font-semibold text-primary mb-1">Store Confirm Karega</p>
              <p className="text-sm text-textmuted">Aapka local chemist availability aur price bhejega</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-accent/20">
            <div className="relative h-48">
              <Image src="/images/step-delivery.jpg" alt="Delivery" fill className="object-cover" />
            </div>
            <div className="p-5 text-center">
              <div className="w-9 h-9 rounded-full bg-accent text-primary font-bold flex items-center justify-center mx-auto mb-3">3</div>
              <p className="font-semibold text-primary mb-1">Delivery ya Pickup</p>
              <p className="text-sm text-textmuted">Ghar baithe pao, ya store se le lo</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY MEDLINK */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-primary text-center mb-12">MedLink Kyun</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-md p-6 flex gap-4 items-start border border-accent/20">
            <span className="text-3xl">🏪</span>
            <div>
              <p className="font-semibold text-primary text-lg">Sirf Local, Registered Chemists</p>
              <p className="text-sm text-textmuted mt-1">Har store manually verify hota hai, drug license ke saath</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 flex gap-4 items-start border border-accent/20">
            <span className="text-3xl">💊</span>
            <div>
              <p className="font-semibold text-primary text-lg">Prescription-Based Order</p>
              <p className="text-sm text-textmuted mt-1">Prescription upload karo, store hi price aur availability confirm karega</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 flex gap-4 items-start border border-accent/20">
            <span className="text-3xl">🤝</span>
            <div>
              <p className="font-semibold text-primary text-lg">Aapke Chemist Ko Support</p>
              <p className="text-sm text-textmuted mt-1">Bade online players ke bajaye, apne mohalle ke store ko badhawa do</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 flex gap-4 items-start border border-accent/20">
            <span className="text-3xl">🚚</span>
            <div>
              <p className="font-semibold text-primary text-lg">Delivery Ya Pickup, Aapki Marzi</p>
              <p className="text-sm text-textmuted mt-1">Ghar tak delivery, ya khud store se le jao</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST & SAFETY */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-primary text-center mb-10">Bharosa aur Suraksha</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-accent/20">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-primary text-lg mb-1">Verified Stores Only</p>
            <p className="text-sm text-textmuted">Sirf drug license verified medical stores hi list me aate hain</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-accent/20">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-primary text-lg mb-1">Prescription Required</p>
            <p className="text-sm text-textmuted">Har order pe prescription check hota hai, galat dawai nahi milegi</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-accent/20">
            <div className="text-4xl mb-3">🔒</div>
            <p className="font-semibold text-primary text-lg mb-1">Secure & Private</p>
            <p className="text-sm text-textmuted">Aapka data aur prescription completely private rehta hai</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-primary text-center mb-12">Log Kya Kehte Hain</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-bg rounded-2xl p-6 shadow-sm border border-accent/20">
              <p className="text-textmuted text-sm mb-4">
                "Pehle online medicine order karne me darr lagta tha. MedLink pe local chemist se order kiya, bilkul sahi dawai mili aur jaldi deliver ho gayi."
              </p>
              <p className="font-semibold text-primary">— Rahul S., Customer</p>
            </div>
            <div className="bg-bg rounded-2xl p-6 shadow-sm border border-accent/20">
              <p className="text-textmuted text-sm mb-4">
                "Mera medical store ab online orders bhi le raha hai. Customers khush hain aur business bhi badha hai."
              </p>
              <p className="font-semibold text-primary">— Anil Chemist, Store Owner</p>
            </div>
            <div className="bg-bg rounded-2xl p-6 shadow-sm border border-accent/20">
              <p className="text-textmuted text-sm mb-4">
                "Prescription upload kiya aur 2 ghante me dawai ghar aa gayi. Local store se hi mili, trust bana rahta hai."
              </p>
              <p className="font-semibold text-primary">— Priya M., Customer</p>
            </div>
          </div>
        </div>
      </section>

      {/* STORE OWNER CTA */}
      <section className="bg-primary py-14 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/images/store-owner.jpg"
              alt="Store Owner"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-4">Aap Medical Store Owner Hain?</h2>
            <p className="text-accent text-lg mb-7">
              Apna store digitally register karo, online orders lo, aur apne business ko badhao.
            </p>
            <a href="/login" className="bg-white text-primary px-7 py-3.5 rounded-xl font-semibold inline-block hover:bg-accent transition shadow-lg">
              Store Register Karo
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-primary text-center mb-10">Aksar Puche Jane Wale Sawal</h2>
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-accent/20">
            <p className="font-semibold text-primary mb-1">Kya sirf registered stores hi hain?</p>
            <p className="text-sm text-textmuted">Haan, har store ko manually verify kiya jata hai drug license ke saath.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-accent/20">
            <p className="font-semibold text-primary mb-1">Prescription upload karna zaroori hai?</p>
            <p className="text-sm text-textmuted">Haan, schedule H aur X medicines ke liye prescription zaroori hai.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-accent/20">
            <p className="font-semibold text-primary mb-1">Delivery kitne time me hoti hai?</p>
            <p className="text-sm text-textmuted">Local store ke hisaab se 1-4 hours me delivery mil sakti hai.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-accent/20">
            <p className="font-semibold text-primary mb-1">Payment kaise hota hai?</p>
            <p className="text-sm text-textmuted">Customer store ke UPI ID/QR par seedha payment karta hai, ya Cash on Delivery.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 text-sm text-textmuted border-t border-accent/30">
        © 2026 MedLink. Local chemists ke liye bana.
      </footer>
    </main>
  )
}