import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Mặc định lấy từ đầu tháng đến ngày hôm nay
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDay = today.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(currentDay);

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        setIsLoading(true);
        try {
            // Truyền params startDate và endDate xuống backend
            const res = await axios.get("http://localhost:9999/management/dashboard/stats", {
                params: { startDate, endDate }
            });

            if (res.data.success) {
                setDashboardData(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi tải dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !dashboardData) {
        return <div className="container-fluid py-4 text-center"><h5>Đang tải dữ liệu hệ thống...</h5></div>;
    }

    const kpi = dashboardData?.kpi || {};
    const chartData = dashboardData?.chartData || [];
    const deliveryStats = dashboardData?.deliveryStats || [];

    return (
        <div className="container-fluid p-0" style={{ minHeight: "100vh" }}>
            {/* THANH TIÊU ĐỀ VÀ BỘ LỌC THỜI GIAN */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm">
                <h3 className="mb-0 text-primary fw-bold m-0">📊 Bảng Thống Kê Tổng Quan</h3>

                <div className="d-flex align-items-center gap-3 flex-wrap mt-2 mt-md-0">
                    <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-secondary">Từ:</span>
                        <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-secondary">Đến:</span>
                        <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-primary fw-bold px-4 shadow-sm"
                        onClick={loadDashboardStats}
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang lọc..." : "🔍 Lọc"}
                    </button>
                </div>
            </div>

            {/* HÀNG 1: CÁC THẺ KPI TỔNG QUAN */}
            <div className="row g-4 mb-4">
                <div className="col-xl-3 col-md-6">
                    <div className="card shadow-sm border-0 border-start border-primary border-4 h-100">
                        <div className="card-body">
                            <div className="text-muted fw-bold text-uppercase mb-1">Tổng Doanh Thu</div>
                            <div className="h3 mb-0 fw-bold text-primary">
                                {Number(kpi.TotalRevenue || 0).toLocaleString('vi-VN')} đ
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-md-6">
                    <div className="card shadow-sm border-0 border-start border-success border-4 h-100">
                        <div className="card-body">
                            <div className="text-muted fw-bold text-uppercase mb-1">Đơn Thành Công</div>
                            <div className="h3 mb-0 fw-bold text-success">
                                {kpi.TotalSuccessOrders || 0} / {kpi.TotalOrdersPeriod || 0}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-md-6">
                    <div className="card shadow-sm border-0 border-start border-danger border-4 h-100">
                        <div className="card-body">
                            <div className="text-muted fw-bold text-uppercase mb-1">Đơn Bị Hủy / Thất bại</div>
                            <div className="h3 mb-0 fw-bold text-danger">
                                {kpi.TotalFailedOrders || 0}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-md-6">
                    <div className="card shadow-sm border-0 border-start border-warning border-4 h-100">
                        <div className="card-body">
                            <div className="text-muted fw-bold text-uppercase mb-1">Khách / Đối Tác</div>
                            <div className="h3 mb-0 fw-bold text-dark">
                                {kpi.TotalCustomers || 0} <span className="fs-5 text-muted"> KH</span> / {kpi.TotalDeliverySystems || 0} <span className="fs-5 text-muted"> VC</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HÀNG 2: BIỂU ĐỒ */}
            <div className="row g-4 mb-4">
                {/* Biểu đồ Doanh thu (Line Chart) */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white fw-bold py-3">
                            📈 Doanh thu từ {new Date(startDate).toLocaleDateString('vi-VN')} đến {new Date(endDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="card-body" style={{ height: "400px" }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="OrderDate" tickFormatter={(tick) => new Date(tick).toLocaleDateString('vi-VN')} />
                                        <YAxis tickFormatter={(tick) => `${(tick / 1000000).toFixed(1)}M`} />
                                        <Tooltip
                                            formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="DailyRevenue" name="Doanh thu (VNĐ)" stroke="#4e73df" strokeWidth={3} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-100 d-flex align-items-center justify-content-center text-muted">Không có dữ liệu doanh thu trong khoảng thời gian này.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Biểu đồ Đơn hàng (Bar Chart) */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white fw-bold py-3">📦 Tỷ lệ hoàn thành đơn</div>
                        <div className="card-body" style={{ height: "400px" }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="OrderDate" tickFormatter={(tick) => new Date(tick).getDate()} />
                                        <YAxis />
                                        <Tooltip labelFormatter={(label) => `Ngày ${new Date(label).toLocaleDateString('vi-VN')}`} />
                                        <Legend />
                                        <Bar dataKey="SuccessOrders" name="Thành công" stackId="a" fill="#1cc88a" maxBarSize={50} />
                                        <Bar dataKey="FailedOrders" name="Hủy/Thất bại" stackId="a" fill="#e74a3b" maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-100 d-flex align-items-center justify-content-center text-muted">Không có đơn hàng.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* HÀNG 3: BẢNG HIỆU SUẤT ĐƠN VỊ VẬN CHUYỂN */}
            <div className="row">
                <div className="col-12">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white fw-bold py-3">🚚 Hiệu Suất Đối Tác Giao Hàng</div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4 py-3">Tên Đơn Vị VC</th>
                                            <th className="text-center py-3">Tổng Đơn Đã Nhận</th>
                                            <th className="text-center text-success py-3">Giao Thành Công</th>
                                            <th className="text-center text-danger py-3">Giao Thất Bại</th>
                                            <th className="text-end pe-4 py-3">Tỷ Lệ Thành Công</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveryStats.length > 0 ? deliveryStats.map((ds) => (
                                            <tr key={ds.id_delivery_system}>
                                                <td className="ps-4 fw-bold">{ds.DeliveryName}</td>
                                                <td className="text-center">{ds.TotalAssignedOrders}</td>
                                                <td className="text-center fw-bold text-success">{ds.SuccessDeliveries}</td>
                                                <td className="text-center fw-bold text-danger">{ds.FailedDeliveries}</td>
                                                <td className="text-end pe-4">
                                                    <div className="d-flex align-items-center justify-content-end">
                                                        <span className="me-2 fw-bold">{ds.SuccessRatePercent}%</span>
                                                        <div className="progress" style={{ width: "80px", height: "8px" }}>
                                                            <div
                                                                className={`progress-bar ${ds.SuccessRatePercent >= 80 ? 'bg-success' : ds.SuccessRatePercent >= 50 ? 'bg-warning' : 'bg-danger'}`}
                                                                role="progressbar"
                                                                style={{ width: `${ds.SuccessRatePercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4 text-muted">Không có dữ liệu vận chuyển trong thời gian này.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}