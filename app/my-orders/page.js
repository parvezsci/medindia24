'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import OrderTimeline from '../../components/OrderTimeline'

export default function MyOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const { data, error } = await supabase
      .from('orders')
      .select('*, stores(store_name, upi_id, qr_code_url, address), order_items(*)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) console.log('Error loading orders:', error)
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const confirmPriceAndOrder = async (orderId) => {
    await supabase.from('orders').update({ status: 'accepted' }).eq('id', orderId)
    load()
  }

  const rejectPrice = async (orderId) => {
    if (!confirm('Is price par order cancel karna hai?')) return
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    load()
  }

  const markPaid = async (orderId) => {
    await supabase.from('orders').update({ payment_status: 'customer_paid' }).eq('id', orderId)
    load()
  }

  const markCOD = async (orderId) => {
    await supabase.from('orders').update({ payment_status: 'cod' }).eq('id', orderId)
    load()
  }

  const markReceived = async (orderId) => {
    if (!confirm('Kya aapko order mil gaya hai?')) return
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId)
    load()
  }

  const cancelOrder = async (orderId) => {
    if (!confirm('Order cancel karna hai?')) return
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    load()
  }

  if (loading) return <p className="p-6 text-textmuted">Loading...</p>

  return (
    <main className="min-h-screen bg-bg p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-primary">Mere Orders</h1>
        {orders.length === 0 && <p className="text-textmuted">Koi order nahi hai. <a href="/order" className="underline text-secondary">Order karo</a></p>}

        {orders.map((o) => (
          <div key={o.id} className="bg-white p-4 rounded-xl shadow space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{o.stores?.store_name || 'Store'}</p>
                <p className="text-xs text-textmuted">{o.stores?.address}</p>
              </div>
              <p className="text-xs text-textmuted">{new Date(o.created_at).toLocaleDateString('en-IN')}</p>
            </div>

            <OrderTimeline status={o.status} />

            <div className="border-t border-accent pt-2 space-y-1">
              <p className="text-xs font-semibold text-textmuted uppercase">Medicines</p>
              {o.order_items?.map((it) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span>
                    {it.medicine_name} x{it.quantity}
                    {!it.available && it.price !== null && <span className="text-red-600 text-xs"> (unavailable)</span>}
                  </span>
                  <span className="font-semibold">
                    {it.price ? `₹${it.price * it.quantity}` : <span className="text-textmuted">Price pending</span>}
                  </span>
                </div>
              ))}
            </div>

            {o.total_amount > 0 && (
              <div className="flex justify-between border-t border-accent pt-2 font-bold text-primary">
                <span>Total</span>
                <span>₹{o.total_amount}</span>
              </div>
            )}

            <p className="text-sm text-textmuted">Delivery: {o.delivery_type === 'delivery' ? 'Home Delivery' : 'Store Pickup'}</p>
            {o.delivery_address && <p className="text-xs text-textmuted">{o.delivery_address}</p>}

            {/* Price confirmation step - naya */}
            {o.status === 'price_pending' && (
              <div className="border-2 border-secondary rounded-lg p-3 bg-accent/10 space-y-2">
                <p className="font-semibold text-sm text-primary">Store ne price bheja hai, confirm karo</p>
                <p className="text-xs text-textmuted">Total: ₹{o.total_amount} ke liye order confirm karna hai?</p>
                <div className="flex gap-2">
                  <button onClick={() => confirmPriceAndOrder(o.id)} className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold flex-1">
                    Price Confirm Karo
                  </button>
                  <button onClick={() => rejectPrice(o.id)} className="bg-white border border-red-600 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold flex-1">
                    Cancel Karo
                  </button>
                </div>
              </div>
            )}

            {/* Payment section */}
            {o.status === 'accepted' && o.total_amount > 0 && (!o.payment_status || o.payment_status === 'pending') && (
              <div className="border-t border-accent pt-3 mt-1 space-y-2 bg-bg rounded-lg p-3">
                <p className="font-semibold text-sm">Payment karo: ₹{o.total_amount}</p>

                {o.stores?.upi_id && <p className="text-sm">UPI ID: <b>{o.stores.upi_id}</b></p>}
                {o.stores?.upi_id && (
  <img
    src={
      o.stores.qr_code_url ||
      `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        `upi://pay?pa=${o.stores.upi_id}&pn=${encodeURIComponent(o.stores.store_name)}&am=${o.total_amount}&cu=INR`
      )}`
    }
    alt="Payment QR Code"
    className="w-48 h-48 object-contain border border-accent rounded-lg mx-auto bg-white p-2"
  />
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

            {/* Customer khud confirm kare ki order mil gaya */}
            {o.status === 'out_for_delivery' && (
              <button onClick={() => markReceived(o.id)} className="w-full bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold mt-2">
                Maine Order Receive Kar Liya ✅
              </button>
            )}

            {o.status === 'delivered' && (
              <p className="text-green-700 font-semibold text-sm text-center">Order Delivered ✅</p>
            )}

            {(o.status === 'placed') && (
              <button onClick={() => cancelOrder(o.id)} className="text-red-600 text-xs font-semibold">
                Order Cancel Karo
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}