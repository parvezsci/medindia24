export default function OrderTimeline({ status }) {
  const stepMap = {
    placed: 0,
    price_pending: 0,
    accepted: 1,
    out_for_delivery: 2,
    delivered: 3,
  }

  const steps = ['Order Diya', 'Accept Hua', 'Delivery Par', 'Mil Gaya']

  if (status === 'rejected' || status === 'cancelled') {
    return (
      <p className="text-red-600 font-semibold text-sm py-2">
        {status === 'rejected' ? 'Order Reject Ho Gaya ❌' : 'Order Cancel Ho Gaya ❌'}
      </p>
    )
  }

  const currentIndex = stepMap[status] ?? 0

  return (
    <div className="flex items-center py-3">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= currentIndex ? 'bg-secondary text-white' : 'bg-accent text-textmuted'
              }`}
            >
              {i <= currentIndex ? '✓' : i + 1}
            </div>
            <p className={`text-[10px] mt-1 text-center w-16 ${i <= currentIndex ? 'text-primary font-semibold' : 'text-textmuted'}`}>
              {label}
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