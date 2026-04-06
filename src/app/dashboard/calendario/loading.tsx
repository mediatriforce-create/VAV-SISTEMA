import { BorealSkeleton } from '@/components/ui/BorealSkeleton'

export default function CalendarioLoading() {
    return (
        <div className="flex flex-col gap-4 w-full pt-4 px-4 h-full">
            <BorealSkeleton className="h-10 rounded-xl w-64" />
            <BorealSkeleton className="flex-1 rounded-3xl min-h-[500px]" />
        </div>
    )
}
