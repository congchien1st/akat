import React, {useState, useEffect} from "react";
import {fetchDataGraphApi} from "./fetch-data.js";
import PageCard from "../../components/resource-page/PageCard.jsx";

// import "./ResourcePage.css"; // .css => apply cho toan bo app (nhu binh thuong)
import styles from './ResourcePage.module.css';  // .module.css => chi apply cho component hien tai
import {Search} from "lucide-react";

function ResourcePage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pages, setPages] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [stats, setStats] = useState({});
    /**
     * fetch data api
     */
    useEffect(() => {
        const loadDataPages = async () => {
            try {
                const dataPages = await fetchDataGraphApi();
                // console.log("Data page: " + dataPages);
                setPages(dataPages);

                const totalStats = dataPages.reduce(
                    (acc, item) => {
                        acc.totalFanpages = dataPages.length;
                        acc.totalFollows += item.follows;
                        acc.totalInteractions += item.interactions;
                        acc.totalApproach += item.approach;
                        acc.totalPosts += item.posts;
                        return acc;
                    },
                    {totalFollows: 0,  totalInteractions: 0, totalApproach: 0, totalPosts: 0}
                );
                setStats(totalStats);
            } catch (e) {
                console.log(e);
                setError("failed to load data pages");
            }
            finally {
                setLoading(false);
            }
        }
        loadDataPages();
    },[])

    /**
     * search page
     */
    const searchPages = pages.filter(page =>
        page.name.toLowerCase().includes(searchQuery.toLowerCase())
    );




    return (
        <div>
            {error && <div className="error-message">{error}</div>}

            {loading? (
                <div className="loading">Loading...</div>
            ): (
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.customH1}> Quản lý tài nguyên</h1>
                        <div>
                            {/*<div className="flex items-center gap-2 bg-white rounded-lg border p-2">*/}
                            {/*    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"*/}
                            {/*         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"*/}
                            {/*         strokeLinejoin="round" className="lucide lucide-calendar w-5 h-5 text-gray-500">*/}
                            {/*        <path d="M8 2v4"></path>*/}
                            {/*        <path d="M16 2v4"></path>*/}
                            {/*        <rect width="18" height="18" x="3" y="4" rx="2"></rect>*/}
                            {/*        <path d="M3 10h18"></path>*/}
                            {/*    </svg>*/}
                            {/*    <select className="text-sm border-0 focus:ring-0">*/}
                            {/*        <option value="7">7 ngày gần nhất</option>*/}
                            {/*        <option value="30">30 ngày gần nhất</option>*/}
                            {/*        <option value="90">90 ngày gần nhất</option>*/}
                            {/*    </select></div>*/}
                        </div>
                    </div>
                    <p className={styles["sub-title-page"]}>Tổng quan về hiệu suất và quản lý các trang Facebook đã kết nối</p>

                    <div className={styles["stats-grid"]}>
                        <div className={styles["stat-card"]}>
                            <div className={styles["stat-header"]}>
                                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round" className="lucide lucide-facebook w-6 h-6">
                                        <path
                                            d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                    </svg>
                                </div>
                                <span>Tổng Fanpage</span>
                            </div>
                            <div className={styles["stat-value"]}>{stats.totalFanpages}</div>
                        </div>

                        <div className={styles["stat-card"]}>
                            <div className={styles["stat-header"]}>
                                <div className="p-3 rounded-xl bg-green-50 text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round" className="lucide lucide-users w-6 h-6">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <span>Tổng Người theo dõi</span>
                            </div>
                            <div className={styles["stat-value"]}>{stats.totalFollows}</div>
                        </div>

                        <div className={styles["stat-card"]}>
                            <div className={styles["stat-header"]}>
                                <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round" className="lucide lucide-share2 w-6 h-6">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                                        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                                    </svg>
                                </div>
                                <span>Tương tác</span>
                            </div>
                            <div className={styles["stat-value"]}>{stats.totalInteractions}</div>
                        </div>

                        <div className={styles["stat-card"]}>
                            <div className={styles["stat-header"]}>
                                <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round" className="lucide lucide-eye w-6 h-6">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </div>
                                <span>Tổng tiếp cận</span>
                            </div>
                            <div className={styles["stat-value"]}>{stats.totalApproach}</div>
                        </div>

                        {/*<div className={styles["stat-card"]}>*/}
                        {/*    <div className={styles["stat-header"]}>*/}
                        {/*        <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">*/}
                        {/*            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"*/}
                        {/*                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"*/}
                        {/*                 strokeLinejoin="round" className="lucide lucide-message-square w-6 h-6">*/}
                        {/*                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>*/}
                        {/*            </svg>*/}
                        {/*        </div>*/}
                        {/*        <span>Tỷ lệ phản hồi</span>*/}
                        {/*    </div>*/}
                        {/*    <div className={styles["stat-value"]}>not know</div>*/}
                        {/*</div>*/}

                        <div className={styles["stat-card"]}>
                            <div className={styles["stat-header"]}>
                                <div className="p-3 rounded-xl bg-red-50 text-red-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round" className="lucide lucide-file-text w-6 h-6">
                                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                        <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                                        <path d="M10 9H8"></path>
                                        <path d="M16 13H8"></path>
                                        <path d="M16 17H8"></path>
                                    </svg>
                                </div>
                                <span>Tổng bài đăng</span>
                            </div>
                            <div className={styles["stat-value"]}>{stats.totalPosts}</div>
                        </div>
                    </div>

                    <div className={styles["pages-section"]}>
                        <div className={styles["pages-header"]}>
                            <div className={styles.pagesConnected}>Facebook Pages đã kết nối</div>
                            <div className="flex gap-3 w-full sm:w-auto">

                                <div className="relative flex-1 sm:flex-initial">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm trang..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                                
                                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round" className="lucide lucide-download w-4 h-4">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" x2="12" y1="15" y2="3"></line>
                                    </svg>
                                    <span>Xuất</span></button>
                                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round" className="lucide lucide-plus w-4 h-4">
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5v14"></path>
                                    </svg>
                                    <span>Thêm Page</span></button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {searchPages.map((item) => {
                                return <PageCard page={item} key={item.id}/>
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ResourcePage;