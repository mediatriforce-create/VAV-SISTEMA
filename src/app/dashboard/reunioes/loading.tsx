import { BorealSkeleton } from '@/components/ui/BorealSkeleton'

export default function ReunioesLoading() {
    return (
        <div className="flex flex-col gap-4 w-full pt-4 px-4">
            <BorealSkeleton className="h-10 rounded-xl w-48" />
            <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                    <BorealSkeleton key={i} className="h-24 rounded-2xl" />
                ))}
            </div>
        </div>
    )
}
