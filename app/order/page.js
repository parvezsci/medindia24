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
  const [suggestions, setSuggestions] = useState({})

  // Nearby stores wala naya part
  const [nearbyStores, setNearbyStores] = useState(null) // null = abhi dhoonda nahi, [] = dhoonda par mila nahi
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [searchingStores, setSearchingStores] = useState(false)
  const [custLat, setCustLat] = useState(null)
  const [custLng, setCustLng] = useState(null)

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

  const updateItem = async (i, field, val) => {
    const copy = [...items]
    copy[i][field] = val
    setItems(copy)

    if (field === 'medicine_name' && val.trim().length >= 2) {
      const { data } = await supabase
        .from('medicines_master')
        .select('name, requires_prescription')
        .ilike('name', `%${val}%`)
        .limit(6)
      setSuggestions((prev) => ({ ...prev, [i]: data || [] }))
    } else if (field === 'medicine_name') {
      setSuggestions((prev) => ({ ...prev, [i]: [] }))
    }
  }

  const selectSuggestion = (i, name) => {
    const copy = [...items]
    copy[i].medicine_name = name
    setItems(copy)
    setSuggestions((prev) => ({ ...prev, [i]: [] }))
  }

  const addItemRow = () => setItems([...items, { medicine_name: '', quantity: 1 }])
  const removeItemRow = (i) => setItems(items.filter((_, idx) => idx !== i))

  // Step 1: Nearby stores dhoondo
  const findStores = () => {
    setMsg('')
    setNearbyStores(null)
    setSelectedStoreId('')

    const hasMedicine = items.some((it) => it.medicine_name.trim() !== '')
    if (!hasMedicine) {
      setMsg('Kam se kam ek medicine ka naam likho')
      return
    }
    if (!address.trim()) {
      setMsg('Delivery address likho')
      return
    }

    if (!navigator.geolocation) {
      setMsg('Aapke browser me location support nahi hai')
      return
    }

    setSearchingStores(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setCustLat(pos.coords.latitude)
        setCustLng(pos.coords.longitude)

        const { data: stores, error } = await supabase
          .from('stores')
          .select('id, store_name, address, pincode, lat, lng')
          .eq('is_approved', true)
          .eq('is_open', true)

        setSearchingStores(false)

        if (error) {
          setMsg('Stores dhoondhne me error: ' + error.message)
          return
        }

        const withDistance = (stores || [])
          .filter((s) => s.lat && s.lng)
          .map((s) => ({
            ...s,
            distance: getDistanceKm(pos.coords.latitude, pos.coords.longitude, s.lat, s.lng),
          }))
          .filter((s) => s.distance <= RADIUS_KM)
          .sort((a, b) => a.distance - b.distance)

        setNearbyStores(withDistance)

        if (withDistance.length === 0) {
          setMsg(`Aapke ${RADIUS_KM} km ke andar koi khula registered store nahi mila.`)
        }
      },
      () => {
        setSearchingStores(false)
        setMsg('Location allow karo, nearby stores dhoondne ke liye zaroori hai')
      }
    )
  }

  // Step 2: Order confirm karo selected store ko
  const confirmOrder = async () => {
    setMsg('')

    if (!selectedStoreId) {
      setMsg('Pehle ek store select karo')
      return
    }

    setLoading(true)

    // Prescription upload
    let prescriptionUrl = null
    if (files.length > 0) {
      const path = `${userId}/${Date.now()}_${files[0].name}`
      const { error: uploadErr } = await supabase.storage.from('prescriptions').upload(path, files[0])
      if (!uploadErr) prescriptionUrl = path
    }

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      customer_id: userId,
      store_id: selectedStoreId,
      delivery_address: address,
      delivery_type: deliveryType,
      prescription_url: prescriptionUrl,
      status: 'placed',
      customer_lat: custLat,
      customer_lng: custLng,
    }).select().single()

    if (orderErr) {
      setLoading(false)
      setMsg('ORDER CREATE FAILED: ' + orderErr.message)
      return
    }

    // Baaki prescription images (agar ek se zyada hain)
    for (let i = 1; i < files.length; i++) {
      const path = `${userId}/${Date.now()}_${files[i].name}`
      const { error: uploadErr } = await supabase.storage.from('prescriptions').upload(path, files[i])
      if (!uploadErr) {
        await supabase.from('order_prescriptions').insert({ order_id: order.id, file_path: path })
      }
    }

    const validItems = items.filter((it) => it.medicine_name.trim() !== '')
    if (validItems.length > 0) {
      const rows = validItems.map((it) => ({
        order_id: order.id,
        medicine_name: it.medicine_name,
        quantity: it.quantity,
      }))
      const { error: itemsErr } = await supabase.from('order_items').insert(rows)
      if (itemsErr) {
        setLoading(false)
        setMsg('MEDICINE ITEMS FAILED: ' + itemsErr.message)
        return
      }
    }

    setLoading(false)
    setMsg('✅ Order successfully store ko bhej diya gaya!')
    setTimeout(() => router.push('/my-orders'), 1500)
  }

  const input = 'w-full border border-accent rounded-lg p-3 bg-white text-text'
  const label = 'font-semibold text-text'

  return (
    <main className="min-h-screen bg-bg p-4">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-bold text-primary">Order place karo</h1>

        <div>
          <label className={label}>Medicines (naam + quantity)</label>
          {items.map((it, i) => (
            <div key={i} className="relative mt-2">
              <div className="flex gap-2">
                <input
                  className={input}
                  placeholder="Medicine ka naam (type karo, suggestions aayenge)"
                  value={it.medicine_name}
                  onChange={(e) => updateItem(i, 'medicine_name', e.target.value)}
                  autoComplete="off"
                />
                <input
                  className="w-20 border border-accent rounded-lg p-3 bg-white text-text"
                  type="number" min="1"
                  value={it.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItemRow(i)} className="text-red-600 px-2">✕</button>
                )}
              </div>

              {suggestions[i]?.length > 0 && (
                <div className="absolute z-10 bg-white border border-accent rounded-lg shadow-lg mt-1 w-full max-h-48 overflow-y-auto">
                  {suggestions[i].map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectSuggestion(i, s.name)}
                      className="px-3 py-2 text-sm hover:bg-bg cursor-pointer flex justify-between items-center"
                    >
                      <span>{s.name}</span>
                      {s.requires_prescription && (
                        <span className="text-xs text-orange-600 font-semibold">Rx</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={addItemRow} className="text-secondary font-semibold mt-2">+ Aur medicine jodo</button>
        </div>

        <div>
          <label className={label}>Prescription photos (optional)</label>
          <input type="file" accept="image/*,.pdf" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="mt-1" />
          {files.length > 0 && <p className="text-sm text-secondary mt-1">{files.length} file(s) select ki gayi</p>}
        </div>

        <div>
          <label className={label}>Delivery address</label>
          <textarea className={input} value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>

        <div>
          <label className={label}>Delivery type</label>
          <select className={input} value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
            <option value="delivery">Home delivery</option>
            <option value="pickup">Store se pickup</option>
          </select>
        </div>

        {msg && (
          <p className={msg.startsWith('✅') ? 'text-secondary text-sm font-semibold' : 'text-red-600 text-sm font-semibold'}>
            {msg}
          </p>
        )}

        {/* Step 1 button */}
        {nearbyStores === null && (
          <button
            onClick={findStores}
            disabled={searchingStores}
            className="w-full bg-primary text-white p-3 rounded-lg font-semibold"
          >
            {searchingStores ? 'Stores dhoond rahe hain...' : 'Nearby Stores Dhoondo'}
          </button>
        )}

        {/* Step 2: Store list dikhao */}
        {nearbyStores !== null && nearbyStores.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-primary">Apna Store Choose Karo</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {nearbyStores.map((s) => (
                <label
                  key={s.id}
                  className={`block border rounded-lg p-3 cursor-pointer ${selectedStoreId === s.id ? 'border-primary bg-accent/20' : 'border-accent'}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="store"
                      value={s.id}
                      checked={selectedStoreId === s.id}
                      onChange={() => setSelectedStoreId(s.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-text">{s.store_name}</p>
                      <p className="text-sm text-textmuted">{s.address}, {s.pincode}</p>
                      <p className="text-xs text-secondary font-semibold">{s.distance.toFixed(1)} km door</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={confirmOrder}
              disabled={loading || !selectedStoreId}
              className="w-full bg-primary text-white p-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Order ho raha hai...' : 'Order Confirm Karo'}
            </button>

            <button
              onClick={() => { setNearbyStores(null); setSelectedStoreId('') }}
              className="w-full text-textmuted text-sm underline"
            >
              Dobara dhoondo
            </button>
          </div>
        )}
      </div>
    </main>
  )
}