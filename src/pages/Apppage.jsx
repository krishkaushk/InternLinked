import { useEffect, useState } from "react";

export default function App() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        fetch("/api/health")
            .then((r) => r.json())
            .then(setData)
            .catch((e) => setErr(String(e)));
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-purple-500">XHacks</h1>
                {err && <p className="text-red-400">Error: {err}</p>}
                {data ? (
                    <pre className="bg-white/10 p-4 rounded-lg">{JSON.stringify(data, null, 2)}</pre>
                ) : (
                    <p>Loading backend…</p>
                )}
            </div>
        </div>
    );
}
