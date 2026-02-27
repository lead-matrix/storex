"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { updateOrderStatus, generateShippingLabel } from "./actions";
import { Package, Truck, ExternalLink, Box, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchOrders() {
            const { data } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });
            setOrders(data ?? []);
            setLoading(false);
        }
        fetchOrders();
    }, [supabase]);

    async function handleStatusUpdate(id: string, status: string) {
        try {
            await updateOrderStatus(id, status);
            setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
            toast.success(`Order marked as ${status}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    }

    async function handleGenerateLabel(orderId: string) {
        const promise = generateShippingLabel(orderId);

        toast.promise(promise, {
            loading: 'Generating shipping label...',
            success: (url) => {
                window.open(url as string, '_blank');
                return 'Label generated successfully';
            },
            error: 'Logistics fulfillment failed'
        });
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order Management</h1>
                    <p className="text-sm text-gray-500 mt-1">View and fulfill customer orders</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                <th className="px-6 py-4">Order Details</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-center">Total</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                            {orders.map((o) => (
                                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                                                <Box className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-mono text-gray-900 font-semibold">
                                                    #{o.id.slice(0, 8).toUpperCase()}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(o.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <select
                                            value={o.status}
                                            onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                                            className={`text-xs font-semibold rounded-full px-3 py-1 border outline-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${o.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    o.status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                        o.status === 'processing' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                            'bg-gray-100 text-gray-800 border-gray-200'
                                                }`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                        </select>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <p className="text-gray-900 font-medium text-sm">{o.customer_email || 'No email'}</p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <div className="text-gray-900 font-bold">
                                            ${Number(o.total_amount || o.amount_total || 0).toFixed(2)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {!o.shipping_label_url ? (
                                                <button
                                                    onClick={() => handleGenerateLabel(o.id)}
                                                    className="bg-blue-600 text-white px-3 py-1.5 text-xs font-medium rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <Truck className="w-3.5 h-3.5" />
                                                    Fulfill
                                                </button>
                                            ) : (
                                                <a
                                                    href={o.shipping_label_url}
                                                    target="_blank"
                                                    className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 text-xs font-medium rounded hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Label
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <Package className="w-10 h-10" />
                                            <p className="text-sm font-medium">No orders found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
