'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function StoreProfile() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [store, setStore] = useState(undefined)
  const [orders, setOrders] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ store_name: '', drug_license_no: '', address: '', pincode: '' })
  const [msg, setMsg] = useState('')
  const [regMsg, setRegMsg] = useState('')
  const [registering, setRegistering] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [qrFile, setQrFile] = useState(null)
  const [qrMsg, setQrMsg] = useState('')
  const [broadcasts, setBroadcasts] = useState([])
  const [earnings, setEarnings] = useState({ total: 0, delivered: 0, pending: 0 })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUserId(user.id)
      loadStore(user.id)
    }
    init()
  }, [router])

  const loadStore = async (uid) => {
    const { data } = await supabase.from('stores').select('*').eq('owner_id', uid).maybeSingle()
    setStore(data)
    if (data) {
      setForm({
        store_name: data.store_name || '',
        drug_license_no: data.drug_license_no || '',
        address: data.address || '',
        pincode: data.pincode || '',
      })
      setUpiId(data.upi_id || '')
      loadOrders(data.id)
      loadBroadcasts(data.id)
    }
  }

  const loadOrders = async (storeId) => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    calcEarnings(data || [])
  }

  const calcEarnings = (ordersList) => {
    const delivered = ordersList.filter((o) => o.status === 'delivered')
    const total = delivered.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const pendingCount = ordersList.filter((o) => ['accepted', 'out_for_delivery'].includes(o.status)).length
    setEarnings({ total, delivered: delivered.length, pending: pendingCount })
  }

  const loadBroadcasts = async (storeId) => {
    const { data } = await supabase
      .from('order_broadcasts')
      .select('*, orders(*, order_items(*))')
      .eq('store_id', storeId)
      .eq('status', 'pending')
    setBroadcasts((data || []).filter((b) => b.orders?.status === 'broadcasting'))
  }

  const acceptBroadcast = async (orderId, storeId) => {
    const { data, error } = await supabase.rpc('accept_broadcast', {
      p_order_id: orderId,
      p_store_id: storeId,
    })
    if (error || !data) {
      alert('Ye order kisi aur store ne pehle le liya')
    }
    loadBroadcasts(storeId)
    loadOrders(storeId)
  }

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const registerStore = async (e) => {
    e.preventDefault()
    setRegMsg('')

    if (!navigator.geolocation) {
      setRegMsg('Location support nahi hai is browser me')
      return
    }

    setRegistering(true)
    setRegMsg('Location le rahe hain...')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setRegMsg('Store register ho raha hai...')

        const { error } = await supabase.from('stores').insert({
          ...form,
          owner_id: userId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })

        setRegistering(false)

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            setRegMsg('Aapka store pehle se register ho chuka hai. Page refresh karo.')
          } else {
            setRegMsg('Error: ' + error.message)
          }
        } else {
          window.location.reload()
        }
      },
      (geoError) => {
        setRegistering(false)
        setRegMsg('Location allow karo, register karne ke liye zaroori hai. (' + geoError.message + ')')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setMsg('')
    const { error } = await supabase.from('stores').update(form).eq('owner_id', userId)
    if (error) setMsg(error.message)
    else {
      setEditMode(false)
      loadStore(userId)
    }
  }

  const saveUpi = async (e) => {
    e.preventDefault()
    setQrMsg('')

    let qr_code_url = store.qr_code_url

    if (qrFile) {
      const path = `${userId}/${Date.now()}_${qrFile.name}`
      const { error: uploadErr } = await supabase.storage.from('qr-codes').upload(path, qrFile)
      if (uploadErr) return setQrMsg(uploadErr.message)

      const { data: publicUrl } = supabase.storage.from('qr-codes').getPublicUrl(path)
      qr_code_url = publicUrl.publicUrl
    }

    const { error } = await supabase.from('stores').update({ upi_id: upiId, qr_code_url }).eq('owner_id', userId)
    if (error) setQrMsg(error.message)
    else {
      setQrMsg('Saved ✅')
      loadStore(userId)
    }
  }

  const toggleOpen = async () => {
    await supabase.from('stores').update({ is_open: !store.is_open }).eq('owner_id', userId)
    loadStore(userId)
  }

  const updateItemPrice = async (itemId, price, storeId) => {
  await supabase.from('order_items').update({ price: Number(price) }).eq('id', itemId)
  loadOrders(storeId)
}

  const toggleAvailable = async (itemId, current, storeId) => {
    await supabase.from('order_items').update({ available: !current }).eq('id', itemId)
    loadOrders(storeId)
  }

  const updateOrderStatus = async (orderId, status, order, storeId) => {
    let total = null
    if (status === 'accepted') {
      total = order.order_items
        .filter((it) => it.available)
        .reduce((sum, it) => sum + (it.price || 0) * it.quantity, 0)
    }
    await supabase.from('orders').update({ status, ...(total !== null && { total_amount: total }) }).eq('id', orderId)
    loadOrders(storeId)
  }
  const sendPriceToCustomer = async (orderId, order, storeId) => {
  const total = order.order_items
    .filter((it) => it.available)
    .reduce((sum, it) => sum + (it.price || 0) * it.quantity, 0)

  if (total <= 0) {
    alert('Pehle kam se kam ek medicine ka price daalo')
    return
  }

  await supabase.from('orders').update({ status: 'price_pending', total_amount: total }).eq('id', orderId)
  loadOrders(storeId)
}
  const confirmPayment = async (orderId, storeId) => {
    await supabase.from('orders').update({ payment_status: 'confirmed' }).eq('id', orderId)
    loadOrders(storeId)
  }

  const input = 'w-full border border-accent rounded-lg p-3 bg-white text-text'

  if (store === undefined) return <p className="p-6 text-textmuted">Loading...</p>

  // Store register nahi hua abhi tak
  if (!store) {
    return (
      <main className="min-h-screen bg-bg p-4">
        <form onSubmit={registerStore} className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow space-y-3 mt-8">
          <h1 className="text-2xl font-bold text-primary">Apna Store Register Karo</h1>
          <p className="text-textmuted text-sm">Ye details submit karne ke baad admin approve karega.</p>
          <input className={input} name="store_name" placeholder="Store ka naam" onChange={update} required />
          <input className={input} name="drug_license_no" placeholder="Drug license number" onChange={update} required />
          <input className={input} name="address" placeholder="Poora address" onChange={update} required />
          <input className={input} name="pincode" placeholder="Pincode" onChange={update} required />
          {regMsg && (
            <p className={regMsg.includes('Error') || regMsg.includes('allow') ? 'text-red-600 text-sm' : 'text-secondary text-sm font-semibold'}>
              {regMsg}
            </p>
          )}
          <button disabled={registering} className="w-full bg-primary text-white p-3 rounded-lg font-semibold">
            {registering ? 'Submit ho raha hai...' : 'Submit'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg p-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Registration success banner (sirf pending hone tak dikhega) */}
        {!store.is_approved && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 text-center">
            <p className="text-orange-700 font-bold text-lg">✅ Registration Ho Gaya Hai!</p>
            <p className="text-orange-700 text-sm mt-1">
              Aapka store admin approval ka wait kar raha hai ⏳. Approve hote hi aap orders lena shuru kar sakte ho.
              Tab tak aap apni UPI payment details neeche se set kar sakte hain.
            </p>
          </div>
        )}

        {/* Store profile card */}
        <div className="bg-white rounded-xl shadow p-6 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary">{store.store_name}</h1>
              <p className="text-sm text-textmuted">License: {store.drug_license_no}</p>
              <p className="text-sm text-textmuted">{store.address}, {store.pincode}</p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${store.is_approved ? 'bg-accent text-primary' : 'bg-orange-100 text-orange-700'}`}>
              {store.is_approved ? 'Approved ✅' : 'Pending ⏳'}
            </span>
          </div>

          {store.is_approved && (
            <button
              onClick={toggleOpen}
              className={`text-sm font-semibold px-3 py-1 rounded-full ${store.is_open ? 'bg-secondary text-white' : 'bg-red-100 text-red-700'}`}
            >
              {store.is_open ? '🟢 Store Khula Hai (tap to close)' : '🔴 Store Band Hai (tap to open)'}
            </button>
          )}

          <button onClick={() => setEditMode(!editMode)} className="text-secondary text-sm font-semibold block">
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>

          {editMode && (
            <form onSubmit={saveEdit} className="space-y-2 pt-2 border-t border-accent">
              <input className={input} name="store_name" value={form.store_name} onChange={update} required />
              <input className={input} name="drug_license_no" value={form.drug_license_no} onChange={update} required />
              <input className={input} name="address" value={form.address} onChange={update} required />
              <input className={input} name="pincode" value={form.pincode} onChange={update} required />
              {msg && <p className="text-red-600 text-sm">{msg}</p>}
              <button className="bg-primary text-white px-4 py-2 rounded-lg font-semibold">Save Changes</button>
            </form>
          )}

          {/* UPI section - approval ka wait kiye bina hi dikhega */}
          <div className="border-t border-accent pt-4 mt-2 space-y-3">
            <h3 className="font-semibold text-primary">Payment Details (UPI)</h3>
            <p className="text-sm text-textmuted">Customer aapko seedha UPI se payment karega, isliye apna UPI ID aur QR daal do. Approval ka wait karne ki zaroorat nahi, abhi se set kar sakte ho.</p>

            <form onSubmit={saveUpi} className="space-y-2">
              <input
                className="w-full border border-accent rounded-lg p-3"
                placeholder="Aapki UPI ID (jaise: yourstore@paytm)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              <input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files[0])} />
              {(store.qr_code_url || upiId) && (
  <div>
    <p className="text-xs text-textmuted mb-1">Aapka Payment QR (customer isको scan karega):</p>
    <img
      src={
        store.qr_code_url ||
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          `upi://pay?pa=${upiId}&pn=${encodeURIComponent(store.store_name)}&cu=INR`
        )}`
      }
      alt="QR Code"
      className="w-32 h-32 object-contain border border-accent rounded-lg bg-white p-1"
    />
  </div>
)}
              {qrMsg && <p className="text-sm text-secondary">{qrMsg}</p>}
              <button className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold text-sm">Save UPI Details</button>
            </form>
          </div>
        </div>

        {/* Earnings summary - sirf approved stores ke liye */}
        {store.is_approved && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-2xl font-bold text-primary">₹{earnings.total}</p>
              <p className="text-xs text-textmuted">Total Kamaya</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-2xl font-bold text-secondary">{earnings.delivered}</p>
              <p className="text-xs text-textmuted">Delivered Orders</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{earnings.pending}</p>
              <p className="text-xs text-textmuted">Chal Rahe Orders</p>
            </div>
          </div>
        )}

        {/* Broadcast section */}
        {broadcasts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-primary mb-2">Naye Order Requests</h2>
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div key={b.id} className="bg-white rounded-xl shadow p-4 border-2 border-secondary space-y-2">
                  <p className="text-sm text-textmuted">Delivery: {b.orders.delivery_type} | {b.orders.delivery_address}</p>
                  {b.orders.order_items.map((it) => (
                    <p key={it.id} className="text-sm">{it.medicine_name} x{it.quantity}</p>
                  ))}
                  {b.orders.prescription_url && <p className="text-sm text-secondary">Prescription attached</p>}
                  <button
                    onClick={() => acceptBroadcast(b.orders.id, store.id)}
                    className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Accept karo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        <div>
          <h2 className="text-xl font-semibold text-primary mb-2">Orders</h2>
          {orders.length === 0 && <p className="text-textmuted">Koi order nahi aaya abhi.</p>}
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-xl shadow p-4 space-y-2">
                <p className="font-semibold">Status: {o.status.replace(/_/g, ' ')}</p>
                <p className="text-sm text-textmuted">Delivery: {o.delivery_type} | {o.delivery_address}</p>
                {o.prescription_url && <p className="text-sm text-secondary">Prescription attached</p>}

                {o.order_items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">{it.medicine_name} x{it.quantity}</span>
                    <input
                      type="number" placeholder="Price"
                      className="w-20 border border-accent rounded p-1"
                      defaultValue={it.price || ''}
                      onBlur={(e) => updateItemPrice(it.id, e.target.value, o.store_id)}
                    />
                    <button
                      onClick={() => toggleAvailable(it.id, it.available, o.store_id)}
                      className={it.available ? 'text-secondary text-xs font-semibold' : 'text-red-600 text-xs font-semibold'}
                    >
                      {it.available ? 'Available' : 'Unavailable'}
                    </button>
                  </div>
                ))}

               <div className="flex gap-2 pt-2">
  {o.status === 'placed' && (
    <>
      <button onClick={() => sendPriceToCustomer(o.id, o, o.store_id)} className="bg-secondary text-white px-3 py-1 rounded-lg text-sm">Price Bhejo Customer Ko</button>
      <button onClick={() => updateOrderStatus(o.id, 'rejected', o, o.store_id)} className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm">Reject</button>
    </>
  )}
  {o.status === 'price_pending' && (
    <p className="text-orange-600 text-sm font-semibold">Customer ke confirm karne ka wait hai ⏳</p>
  )}
  {o.status === 'accepted' && (
    <button onClick={() => updateOrderStatus(o.id, 'out_for_delivery', o, o.store_id)} className="bg-primary text-white px-3 py-1 rounded-lg text-sm">Out for delivery</button>
  )}
  {o.status === 'out_for_delivery' && (
    <p className="text-secondary text-sm font-semibold">Delivery par hai, customer confirm karega jab mil jaye</p>
  )}
</div>

                {o.payment_status === 'customer_paid' && (
                  <div className="bg-orange-50 border border-orange-300 rounded-lg p-2 flex justify-between items-center mt-2">
                    <span className="text-sm text-orange-700 font-semibold">Customer ne payment claim ki hai</span>
                    <button
                      onClick={() => confirmPayment(o.id, o.store_id)}
                      className="bg-secondary text-white px-3 py-1 rounded-lg text-xs font-semibold"
                    >
                      Payment Confirm Karo
                    </button>
                  </div>
                )}
                {o.payment_status === 'confirmed' && (
                  <p className="text-green-700 font-semibold text-sm mt-2">Payment confirmed ✅</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}