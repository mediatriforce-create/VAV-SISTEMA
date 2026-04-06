import { BorealSkeleton } from '@/components/ui/BorealSkeleton'

export default function AdminLoading() {
    return (
        <div className="flex flex-col gap-6 w-full pt-6 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BorealSkeleton className="h-32 rounded-3xl" />
                <BorealSkeleton className="h-32 rounded-3xl" />
                <BorealSkeleton className="h-32 rounded-3xl" />
            </div>
            <BorealSkeleton className="h-12 rounded-2xl w-1/2" />
            <BorealSkeleton className="h-64 rounded-2xl" />
        </div>
    )
}
