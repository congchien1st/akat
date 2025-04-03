// import './PageCard.css'; // .css => apply cho toan bo app (nhu binh thuong)
import styles from './PageCard.module.css'; // .module.css => chi apply cho component hien tai

function PageCard ({page}) {
    return (
        <div className={styles.pageCard}>
            <img src={page.image_url} alt="akamedia-auto"/>
            <div className="">
                <p>follows: {page.follows}</p>
                <p>tuong tac: {page.interactions}</p>
                <p>tiep can: {page.approach}</p>
                <p>so bai viet: {page.posts}</p>
            </div>
        </div>


    )
}

export default PageCard;