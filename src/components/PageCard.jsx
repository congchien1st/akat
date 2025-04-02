function PageCard ({page}) {
    return (
        <div className="page-card">
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