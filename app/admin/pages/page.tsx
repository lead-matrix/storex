export default function AdminPages() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Admin Page Editor</h1>
            <div className="space-y-4">
                <p>Workflow:</p>
                <ul className="list-decimal pl-5">
                    <li>Create page</li>
                    <li>Edit layout</li>
                    <li>Save JSON</li>
                    <li>Publish</li>
                </ul>
                <pre className="bg-gray-100 p-4 rounded text-sm mt-4">
                    {JSON.stringify([
                        { "type": "hero", "title": "New Collection" },
                        { "type": "products", "collection": "featured" }
                    ], null, 2)}
                </pre>
            </div>
        </div>
    )
}
