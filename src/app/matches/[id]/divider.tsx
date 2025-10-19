export const Divider = ({ over }: { over: number }) => (
    <div className="flex items-center">
        <span className="h-px flex-1 bg-gray-300" />
        <span className="shrink-0 px-4 text-gray-900 dark:text-white">Over - {over}</span>
        <span className="h-px flex-1 bg-gray-300" />
    </div>
);