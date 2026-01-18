import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { LayoutDashboard, TrendingUp, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Info, Filter, Database, AlertCircle, RefreshCw } from 'lucide-react';

type CompanyData = {
  Ticker: string;
  Company: string;
  "Market Cap (B)": number | null;
  "PE Ratio": number | null;
  "EV/EBITDA": number | null;
  "EBITDA Margin": number | null;
  "Rev Growth": number | null;
  "Price": number | null;
  "1Y Return": number | null;
  "3Y CAGR": number | null;
};

const SNAPSHOT_FUNDAMENTALS: CompanyData[] = [
  { Ticker: "NESTE.HE", Company: "Neste Oyj", "Market Cap (B)": 24.5, "PE Ratio": 14.2, "EV/EBITDA": 8.5, "EBITDA Margin": 13.2, "Rev Growth": 4.5, "Price": 32.40, "1Y Return": -5.2, "3Y CAGR": 2.1 },
  { Ticker: "FORTUM.HE", Company: "Fortum Oyj", "Market Cap (B)": 12.8, "PE Ratio": 12.5, "EV/EBITDA": 6.9, "EBITDA Margin": 28.5, "Rev Growth": 2.1, "Price": 14.20, "1Y Return": 8.4, "3Y CAGR": 4.5 },
  { Ticker: "WRT1V.HE", Company: "Wärtsilä Oyj", "Market Cap (B)": 10.2, "PE Ratio": 18.4, "EV/EBITDA": 11.2, "EBITDA Margin": 10.8, "Rev Growth": 12.4, "Price": 17.50, "1Y Return": 15.6, "3Y CAGR": 11.2 },
  { Ticker: "KEMPOWR.HE", Company: "Kempower Oyj", "Market Cap (B)": 0.89, "PE Ratio": 45.2, "EV/EBITDA": 22.5, "EBITDA Margin": 8.5, "Rev Growth": 18.5, "Price": 15.49, "1Y Return": -12.4, "3Y CAGR": 25.4 },
  { Ticker: "VALMT.HE", Company: "Valmet Oyj", "Market Cap (B)": 4.8, "PE Ratio": 13.8, "EV/EBITDA": 7.8, "EBITDA Margin": 11.2, "Rev Growth": 3.2, "Price": 26.10, "1Y Return": 4.1, "3Y CAGR": 5.8 }
];

const SNAPSHOT_HISTORY = [
  { Date: '2025-01', NESTE: 100, FORTUM: 100, WRT1V: 100, KEMPOWR: 100, VALMT: 100 },
  { Date: '2025-04', NESTE: 92, FORTUM: 104, WRT1V: 110, KEMPOWR: 102, VALMT: 101 },
  { Date: '2025-07', NESTE: 88, FORTUM: 108, WRT1V: 115, KEMPOWR: 92, VALMT: 103 },
  { Date: '2025-10', NESTE: 95, FORTUM: 108, WRT1V: 118, KEMPOWR: 82, VALMT: 102 },
  { Date: '2026-01', NESTE: 95, FORTUM: 108, WRT1V: 116, KEMPOWR: 87, VALMT: 104 },
];

const COLORS: Record<string, string> = {
  "NESTE.HE": '#00B96B', "FORTUM.HE": '#00A3E0', "WRT1V.HE": '#F58220', 
  "KEMPOWR.HE": '#6C5CE7', "VALMT.HE": '#455A64'
};

const calcWeightedAvg = (data: CompanyData[], metricKey: keyof CompanyData) => {
  let totalWeight = 0;
  let weightedSum = 0;
  
  data.forEach(c => {
    const val = c[metricKey];
    const weight = c["Market Cap (B)"];
    
    if (typeof val === 'number' && typeof weight === 'number' && weight > 0) {
      weightedSum += val * weight;
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

const normalizeHistory = (historyData: any[], tickers: string[]) => {
  if (!historyData || historyData.length === 0) return [];
  
  const firstRow = historyData[0];
  const normalized = historyData.map(row => {
    const newRow: any = { Date: row.Date };
    tickers.forEach(t => {
      const startPrice = firstRow[t];
      const currentPrice = row[t];
      if (startPrice && currentPrice) {
        newRow[t] = (currentPrice / startPrice) * 100;
      }
    });
    return newRow;
  });
  return normalized;
};

const KPICard = ({ title, value, subtext, trend, icon: Icon }: any) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="mt-4 flex items-center">
      {trend === 'up' ? <ArrowUpRight size={16} className="text-emerald-500 mr-1"/> : <ArrowDownRight size={16} className="text-rose-500 mr-1"/>}
      <p className="text-sm text-slate-600">{subtext}</p>
    </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dataMode, setDataMode] = useState<'snapshot' | 'live'>('snapshot');
  
  const [fundamentals, setFundamentals] = useState<CompanyData[]>(SNAPSHOT_FUNDAMENTALS);
  const [history, setHistory] = useState<any[]>(SNAPSHOT_HISTORY);
  
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLiveData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const respFund = await fetch('/latest_fundamentals.json');
      if (!respFund.ok) throw new Error("Fundamentals not found");
      const fundData = await respFund.json();
      
      let histData = [];
      try {
        const respHist = await fetch('/latest_history.json');
        if (respHist.ok) histData = await respHist.json();
      } catch (e) { console.warn("History not found, using snapshot for chart"); }

      if (Array.isArray(fundData) && fundData.length > 0) {
         setFundamentals(fundData);
         if (histData.length > 0) setHistory(normalizeHistory(histData, fundData.map((d:any) => d.Ticker)));
         setDataMode('live');
         setLastUpdated(new Date().toLocaleTimeString());
      } else {
         throw new Error("Invalid data format");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Local data missing. Run the pipeline first.");
      revertToSnapshot();
    } finally {
      setLoading(false);
    }
  };

  const runPipelineRefresh = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/refresh_data', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        setFundamentals(result.data.fundamentals);
        const rawHistory = result.data.history;
        const tickers = result.data.fundamentals.map((d:any) => d.Ticker);
        setHistory(normalizeHistory(rawHistory, tickers));
        
        setDataMode('live');
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Pipeline Error:", error);
      setErrorMsg(`Failed to connect to Python (127.0.0.1:5000). Details: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const revertToSnapshot = () => {
    setFundamentals(SNAPSHOT_FUNDAMENTALS);
    setHistory(SNAPSHOT_HISTORY);
    setDataMode('snapshot');
    setLastUpdated(null);
  };

  const toggleDataMode = () => {
    if (dataMode === 'snapshot') fetchLiveData();
    else revertToSnapshot();
  };

  const totalCap = fundamentals.reduce((acc, curr) => acc + (curr["Market Cap (B)"] || 0), 0);
  
  const wAvgRevenueGrowth = calcWeightedAvg(fundamentals, "Rev Growth");
  const wAvgEBITDAMargin = calcWeightedAvg(fundamentals, "EBITDA Margin");
  

  const validPEs = fundamentals.filter(c => c["PE Ratio"] && c["PE Ratio"] > 0);
  const avgPE = validPEs.reduce((acc, curr) => acc + (curr["PE Ratio"] || 0), 0) / (validPEs.length || 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100">
       <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="bg-emerald-700 p-2 rounded-md mr-3 shadow-sm">
                <TrendingUp className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  Finland Clean Tech <span className="text-emerald-700">Monitor</span>
                </h1>
                <p className="text-xs text-slate-500">Executive Market Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {lastUpdated && <span className="text-xs text-slate-400 hidden sm:inline">Updated: {lastUpdated}</span>}
              
              <button 
                onClick={runPipelineRefresh}
                disabled={isRefreshing || loading}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isRefreshing 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 cursor-wait' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300'
                }`}
              >
                <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                <span>{isRefreshing ? 'Running Pipeline...' : 'Run Pipeline'}</span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-2"></div>

              <button 
                onClick={toggleDataMode}
                disabled={loading || isRefreshing}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  dataMode === 'live' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Database size={12} />
                <span>{loading ? 'Loading...' : (dataMode === 'live' ? 'Live Data (JSON)' : 'Snapshot (Jan 2026)')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="inline-flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            {['overview', 'valuation', 'trends'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab 
                  ? 'bg-slate-100 text-slate-900 shadow-inner' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-md flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{errorMsg}</span>
          </div>
        )}

        {loading ? (
           <div className="h-64 flex flex-col items-center justify-center text-slate-400">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
             <p>Syncing...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <KPICard title="Total Market Cap" value={`€${totalCap.toFixed(1)}B`} subtext="Sector Aggregated" trend="up" icon={PieChart} />

                  <KPICard title="Avg EBITDA Margin" value={`${wAvgEBITDAMargin.toFixed(1)}%`} subtext="Cap-Weighted Avg" trend="up" icon={DollarSign} />
                  <KPICard title="Revenue Growth" value={`${wAvgRevenueGrowth > 0 ? '+' : ''}${wAvgRevenueGrowth.toFixed(1)}%`} subtext="Cap-Weighted Avg" trend="down" icon={TrendingUp} />
                  
                  <KPICard title="Sector P/E" value={`${avgPE.toFixed(1)}x`} subtext="Avg (Positive P/E only)" trend="up" icon={LayoutDashboard} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-base font-bold text-slate-900 mb-6">Valuation Multiples (P/E)</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fundamentals} layout="vertical" margin={{ left: 40, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="Ticker" type="category" width={80} tick={{fontSize: 11, fill: '#64748b'}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '6px' }} />
                          <Bar dataKey="PE Ratio" name="P/E Ratio" radius={[0, 4, 4, 0]} barSize={32}>
                            {fundamentals.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.Ticker] || '#94a3b8'} />
                            ))}
                          </Bar>
                          <ReferenceLine x={avgPE} stroke="#ef4444" strokeDasharray="3 3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-base font-bold text-slate-900 mb-6">Growth vs. Profitability</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fundamentals} margin={{ top: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="Ticker" tick={{fontSize: 10, fill: '#64748b'}} interval={0} />
                          <YAxis tick={{fontSize: 11, fill: '#64748b'}} unit="%" />
                          <Tooltip contentStyle={{ borderRadius: '6px' }} />
                          <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                          <Bar dataKey="EBITDA Margin" name="EBITDA Margin %" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Rev Growth" name="Rev Growth %" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ticker</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Price (€)</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">EV/EBITDA</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">3Y CAGR</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">1Y Return</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {fundamentals.map((company) => (
                        <tr key={company.Ticker} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full mr-2" style={{backgroundColor: COLORS[company.Ticker] || '#94a3b8'}}></div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">{company.Ticker}</div>
                                <div className="text-xs text-slate-500">{company.Company}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                            {company.Price ? `€${company.Price.toFixed(2)}` : <span className="text-slate-400">N/A</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                             {company["EV/EBITDA"] ? `${company["EV/EBITDA"].toFixed(1)}x` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                            {company["3Y CAGR"] ? `${company["3Y CAGR"].toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {company["1Y Return"] !== null ? (
                              <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${company["1Y Return"]! >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {company["1Y Return"]! > 0 ? '+' : ''}{company["1Y Return"]!.toFixed(1)}%
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'trends' && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-in fade-in">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Historical Performance (Indexed)</h3>
                      <p className="text-sm text-slate-500">Base 100 = Start of Period</p>
                    </div>
                    {dataMode === 'snapshot' && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded font-medium"> Simulated Snapshot </span>
                    )}
                 </div>
                 <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="Date" tick={{fontSize: 12}} tickFormatter={(val) => val.slice(0,7)} minTickGap={30} />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ borderRadius: '6px' }} />
                        <Legend />
                        {fundamentals.map(c => (
                          <Line 
                            key={c.Ticker}
                            type="monotone" 
                            dataKey={c.Ticker} 
                            stroke={COLORS[c.Ticker] || '#94a3b8'} 
                            strokeWidth={2} 
                            dot={false} 
                            connectNulls 
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            )}

            {activeTab === 'valuation' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                  <Info className="text-blue-600 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">Relative Valuation Methodology</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Comparing multiples reveals distinct clusters. 
                      <span className="font-semibold"> Mature industrials</span> typically trade at compressed multiples reflecting stable cash flows, 
                      while <span className="font-semibold">Growth-stage companies</span> command valuation premiums pricing in future market share expansion.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Enterprise Value / EBITDA</h3>
                        <p className="text-xs text-slate-500">Neutralizes debt structure comparisons</p>
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fundamentals} layout="vertical" margin={{ left: 40, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="Ticker" type="category" width={80} tick={{fontSize: 11, fill: '#64748b'}} />
                          <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            formatter={(value: number) => [`${value?.toFixed(1)}x`, 'EV/EBITDA']}
                          />
                          <Bar dataKey="EV/EBITDA" name="EV/EBITDA" radius={[0, 4, 4, 0]} barSize={32} fill="#6366f1">
                             {fundamentals.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry["EV/EBITDA"] && entry["EV/EBITDA"] > 15 ? '#818cf8' : '#4f46e5'} />
                             ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                         <h3 className="text-base font-bold text-slate-900">Price / Earnings (P/E)</h3>
                         <p className="text-xs text-slate-500">Premium paid for current earnings</p>
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fundamentals} layout="vertical" margin={{ left: 40, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="Ticker" type="category" width={80} tick={{fontSize: 11, fill: '#64748b'}} />
                          <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            formatter={(value: number) => [value ? `${value.toFixed(1)}x` : 'N/A', 'P/E Ratio']}
                          />
                          <Bar dataKey="PE Ratio" name="P/E Ratio" radius={[0, 4, 4, 0]} barSize={32} fill="#0ea5e9">
                            {fundamentals.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.Ticker] || '#94a3b8'} />
                            ))}
                          </Bar>
                          <ReferenceLine x={15} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: 'Ref Benchmark (15x)', fill: '#94a3b8', fontSize: 10 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                   <div className="px-6 py-4 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Valuation Matrix</h3>
                   </div>
                   <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ticker</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">P/E</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">EV/EBITDA</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Implied Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {fundamentals.map((c) => {
                         let status = "Neutral";
                         let statusColor = "bg-slate-100 text-slate-800";
                         
                         if (c["EV/EBITDA"] !== null && c["EV/EBITDA"] < 0) {
                            status = "Loss-making / NM";
                            statusColor = "bg-gray-100 text-gray-800";
                         } else if (c["PE Ratio"] && c["PE Ratio"] > 25) {
                            status = "Growth Premium";
                            statusColor = "bg-purple-100 text-purple-800";
                         } else if (c["EV/EBITDA"] && c["EV/EBITDA"] > 0 && c["EV/EBITDA"] < 8) {
                            status = "Value / Undervalued";
                            statusColor = "bg-emerald-100 text-emerald-800";
                         }

                         return (
                          <tr key={c.Ticker} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{c.Ticker}</td>
                            <td className="px-6 py-4 text-right text-sm text-slate-600">{c["PE Ratio"] ? `${c["PE Ratio"].toFixed(1)}x` : '-'}</td>
                            <td className="px-6 py-4 text-right text-sm text-slate-600">{c["EV/EBITDA"] ? `${c["EV/EBITDA"].toFixed(1)}x` : '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                         )
                      })}
                    </tbody>
                   </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;