'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getDistanceKm } from '../../lib/distance'

const RADIUS_KM = 25

export default function OrderPage() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [items, setItems] = useState([{ medicine_name: '', quantity: 1 }])
  const [address, setAddress] = useState('')
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [nearbyCount, setNearbyCount] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('saved_address').eq('id', user.id).single()
      if (data?.saved_address) setAddress(data.saved_address)
    }
    init()
  }, [router])

  const updateItem = (i, field, val) => {
    const copy = [...items]
    copy[i][field] = val
    setItems(copy)
  }
  const addItemRow = () => setItems([...items, { medicine_name: '', quantity: 1 }])
  const removeItemRow = (i) => setItems(items.filter((_, idx) => idx !== i))

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')

    if (!navigator.geolocation) {
      setMsg('Aapke browser me location support nahi hai')
      return
    }

    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const custLat = pos.coords.latitude
        const custLng = pos.coords.longitude

        const { data: stores } = await supabase
          .from('stores')
          .select('id, lat, lng')
          .eq('is_approved', true)
          .eq('is_open', true)

        const nearby = (stores || []).filter(
          (s) => s.lat && s.lng && getDistanceKm(custLat, custLng, s.lat, s.lng) <= RADIUS_KM
        )

        if (nearby.length === 0) {
          setLoading(false)
          setMsg(`Aapke area me abhi koi khula store nahi mila (${RADIUS_KM} km ke andar)`)
          return
        }

        const { data: order, error } = await supabase.from('orders').insert({
          customer_id: userId,
          store_id: null,
          delivery_address: address,
          delivery_type: deliveryType,
          status: 'broadcasting',
          customer_lat: custLat,
          customer_lng: custLng,
        }).select().single()

        if (error) { setLoading(false); return setMsg(error.message) }

        const validItems = items.filter((it) => it.medicine_name.trim() !== '')
        if (validItems.length > 0) {
          const rows = validItems.map((it) => ({
            order_id: order.id,
            medicine_name: it.medicine_name,
            quantity: it.quantity,
          }))
          await supabase.from('order_items').insert(rows)
        }

        // Multiple prescription images upload
        for (const file of files) {
          const path = `${userId}/${Date.now()}_${file.name}`
          const { error: uploadErr } = await supabase.storage.from('prescriptions').upload(path, file)
          if (!uploadErr) {
            await supabase.from('order_prescriptions').insert({ order_id: order.id, file_path: path })
          }
        }

        const broadcastRows = nearby.map((s) => ({ order_id: order.id, store_id: s.id }))
        await supabase.from('order_broadcasts').insert(broadcastRows)

        setNearbyCount(nearby.length)
        setLoading(false)
        setTimeout(() => router.push('/my-orders'), 1500)
      },
      () => {
        setLoading(false)
        setMsg('Location allow karo, nearby stores dhoondne ke liye zaroori hai')
      }
    )
  }

  const input = 'w-full border border-accent rounded-lg p-3 bg-white text-text'
  const label = 'font-semibold text-text'

  return (
    <main className="min-h-screen bg-bg p-4">
      <form onSubmit={submit} className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-bold text-primary">Order place karo</h1>
        <p className="text-sm text-textmuted">Aapke {RADIUS_KM} km ke andar ke khule registered stores ko request jayegi.</p>

        <div>
          <label className={label}>Medicines (naam + quantity)</label>
          {items.map((it, i) => (
            <div key={i} className="flex gap-2 mt-2">
              <input className={input} placeholder="Medicine ka naam" value={it.medicine_name}
                onChange={(e) => updateItem(i, 'medicine_name', e.target.value)} />
              <input className="w-20 border border-accent rounded-lg p-3 bg-white text-text" type="number" min="1"
                value={it.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItemRow(i)} className="text-red-600 px-2">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItemRow} className="text-secondary font-semibold mt-2">+ Aur medicine jodo</button>
        </div>

        <div>
          <label className={label}>Prescription photos (optional, ek se zyada bhi daal sakte ho)</label>
          <input type="file" accept="image/*,.pdf" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="mt-1" />
          {files.length > 0 && <p className="text-sm text-secondary mt-1">{files.length} file(s) select ki gayi</p>}
        </div>

        <div>
          <label className={label}>Delivery address</label>
          <textarea className={input} value={address} onChange={(e) => setAddress(e.target.value)} required />
          <p className="text-xs text-textmuted mt-1">Ye <a href="/profile" className="underline">Profile</a> me save ho jata hai aage ke liye.</p>
        </div>

        <div>
          <label className={label}>Delivery type</label>
          <select className={input} value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
            <option value="delivery">Home delivery</option>
            <option value="pickup">Store se pickup</option>
          </select>
        </div>

        {msg && <p className="text-red-600 text-sm">{msg}</p>}
        {nearbyCount !== null && <p className="text-secondary text-sm font-semibold">{nearbyCount} stores ko request bhej di gayi ✅</p>}

        <button disabled={loading} className="w-full bg-primary text-white p-3 rounded-lg font-semibold">
          {loading ? 'Ruko...' : 'Nearby Stores ko Bhejo'}
        </button>
      </form>
    </main>
  )
}