export default function Loading() {
    return (
        <div className="flex items-center justify-center py-8">
            <span className="animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 h-8 w-8 mr-2" />
            <span>Loading collection...</span>
        </div>
    );
}