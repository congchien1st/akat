import {useState, useEffect} from "react";
import {fetchDataGraphApi} from "./fetch-data.js";
import PageCard from "../../components/PageCard.jsx";

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
                <div className="list-pages">
                    {pages.map((item) => {
                        return <PageCard page={item} key={item.id} />
                    })}
                </div>
            ) }
        </div>
    )
}

export default ResourcePage;