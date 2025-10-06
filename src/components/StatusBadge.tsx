export const StatusBadge = ({ isInProgress }: { isInProgress: boolean }) => {
    if (isInProgress) {
        return (
            <span className="absolute top-2 right-4 inline-flex items-center rounded-full bg-orange-500 px-2.5 py-0.5 text-white">
                <p className="text-sm whitespace-nowrap animate-pulse font-bold flex gap-2 items-center">
                    <span className="inline-block w-3 h-3 bg-white rounded-full" />
                    <span>In progress</span>
                </p>
            </span>
        );
    }

    return (
        <span className="absolute top-2 right-4 inline-flex items-center rounded-full bg-blue-500 px-2.5 py-0.5 text-white">
            <p className="text-sm whitespace-nowrap font-bold">Completed</p>
        </span>
    );
};