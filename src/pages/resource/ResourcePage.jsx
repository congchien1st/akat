import {useState, useEffect} from "react";
import {fetchDataGraphApi} from "./fetch-data.js";
import PageCard from "../../components/resource-page/PageCard.jsx";

// import "./ResourcePage.css";
import styles from './ResourcePage.module.css';


function ResourcePage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pages, setPages] = useState([]);

    /**
     * fetch data api
     */
    useEffect(() => {
        const loadDataPages = async () => {
            try {
                const dataPages = await fetchDataGraphApi();
                // console.log("Data page: " + dataPages);
                setPages(dataPages);
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
     * search page ?
     */
    const handleSearch = () => {};



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
                            <div className="flex items-center gap-2 bg-white rounded-lg border p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                     strokeLinejoin="round" className="lucide lucide-calendar w-5 h-5 text-gray-500">
                                    <path d="M8 2v4"></path>
                                    <path d="M16 2v4"></path>
                                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                                    <path d="M3 10h18"></path>
                                </svg>
                                <select className="text-sm border-0 focus:ring-0">
                                    <option value="7">7 ngày gần nhất</option>
                                    <option value="30">30 ngày gần nhất</option>
                                    <option value="90">90 ngày gần nhất</option>
                                </select></div>
                        </div>
                    </div>
                    <p className={styles["sub-title-page"]}>Tổng quan về hiệu suất và quản lý các trang Facebook đã kết
                        nối</p>


                    <div className="list-pages">
                        {pages.map((item) => {
                            return <PageCard page={item} key={item.id}/>
                        })}
                    </div>

                </div>
            )}
        </div>
    )
}

export default ResourcePage;