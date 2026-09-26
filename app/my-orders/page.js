'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import OrderTimeline from '../../components/OrderTimeline'

const statusColor = {
  broadcasting: 'text-textmuted',
  accepted: 'text-secondary',
  rejected: 'text-red-600',
  out_for_delivery: 'text-primary',
  delivered: 'text-green-700',
}

export default function MyOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const { data } = await supabase
      .from('orders')
      .select('*, stores(store_name, upi_id, qr_code_url), order_items(*)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }

  useEffect(() => { load() }, [])

  const markPaid = async (orderId) => {
    await supabase.from('orders').update({ payment_status: 'customer_paid' }).eq('id', orderId)
    load()
  }
  const cancelOrder = async (orderId) => {
  if (!confirm('Order cancel karna hai?')) return
  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
  load()
}
  const markCOD = async (orderId) => {
    await supabase.from('orders').update({ payment_status: 'cod' }).eq('id', orderId)
    load()
  }

  return (
    <main className="min-h-screen bg-bg p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-primary">Mere Orders</h1>
        {orders.length === 0 && <p className="text-textmuted">Koi order nahi hai.</p>}
        {orders.map((o) => (
          <div key={o.id} className="bg-white p-4 rounded-xl shadow space-y-1">
            <p className="font-semibold">{o.stores?.store_name || 'Store dhoonda ja raha hai...'}</p>
            <OrderTimeline status={o.status} />
            <p className="text-sm text-textmuted">Delivery: {o.delivery_type}</p>
            {o.order_items?.map((it) => (
              <p key={it.id} className="text-sm">
                {it.medicine_name} x{it.quantity} {it.price ? `- ₹${it.price}` : ''}
                {!it.available && <span className="text-red-600"> (unavailable)</span>}
              </p>
            ))}
            {o.total_amount > 0 && <p className="font-semibold">Total: ₹{o.total_amount}</p>}

            {o.status === 'accepted' && o.total_amount > 0 && o.payment_status === 'pending' && (
              <div className="border-t border-accent pt-3 mt-2 space-y-2">
                <p className="font-semibold text-sm">Payment karo: ₹{o.total_amount}</p>

                {o.stores?.upi_id && <p className="text-sm">UPI ID: <b>{o.stores.upi_id}</b></p>}
                {o.stores?.qr_code_url && (
                  <img src={o.stores.qr_code_url} alt="Store QR" className="w-40 h-40 object-contain border border-accent rounded-lg" />
                )}

                {o.stores?.upi_id && (
                  <a
                    href={`upi://pay?pa=${o.stores.upi_id}&pn=${encodeURIComponent(o.stores.store_name)}&am=${o.total_amount}&cu=INR`}
                    className="block text-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    UPI App Se Pay Karo
                  </a>
                )}

                <div className="flex gap-2">
                  <button onClick={() => markPaid(o.id)} className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold flex-1">
                    Maine Payment Kar Diya
                  </button>
                  <button onClick={() => markCOD(o.id)} className="bg-white border border-accent text-text px-4 py-2 rounded-lg text-sm font-semibold flex-1">
                    Cash on Delivery
                  </button>
                </div>
              </div>
            )}

            {o.payment_status === 'customer_paid' && (
              <p className="text-orange-600 font-semibold text-sm">Payment claim kiya hai, store confirm karega ⏳</p>
            )}
            {o.payment_status === 'confirmed' && <p className="text-green-700 font-semibold text-sm">Payment confirmed ✅</p>}
            {o.payment_status === 'cod' && <p className="text-secondary font-semibold text-sm">Cash on Delivery chuna gaya</p>}
            {(o.status === 'broadcasting' || o.status === 'accepted') && (
  <button onClick={() => cancelOrder(o.id)} className="text-red-600 text-xs font-semibold mt-2">
    Order Cancel Karo
  </button>
)}
          </div>
        ))}
      </div>
    </main>
  )
}