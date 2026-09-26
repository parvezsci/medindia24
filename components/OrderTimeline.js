export default function OrderTimeline({ status }) {
  const steps = [
    { key: 'broadcasting', label: 'Order Diya' },
    { key: 'accepted', label: 'Accept Hua' },
    { key: 'out_for_delivery', label: 'Delivery Par' },
    { key: 'delivered', label: 'Mil Gaya' },
  ]

  if (status === 'rejected' || status === 'cancelled') {
    return (
      <p className="text-red-600 font-semibold text-sm py-2">
        {status === 'rejected' ? 'Order Reject Ho Gaya ❌' : 'Order Cancel Ho Gaya ❌'}
      </p>
    )
  }

  const currentIndex = steps.findIndex((s) => s.key === status)

  return (
    <div className="flex items-center py-3">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= currentIndex ? 'bg-secondary text-white' : 'bg-accent text-textmuted'
              }`}
            >
              {i <= currentIndex ? '✓' : i + 1}
            </div>
            <p className={`text-[10px] mt-1 text-center w-16 ${i <= currentIndex ? 'text-primary font-semibold' : 'text-textmuted'}`}>
              {step.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-1 mx-1 ${i < currentIndex ? 'bg-secondary' : 'bg-accent'}`} />
          )}
        </div>
      ))}
    </div>
  )
}