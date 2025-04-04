import React from "react";

function PageCard ({page}) {
    return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:bg-gray-50 transition-colors">
                <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <img src={page.image_url} alt="akamedia" className="w-14 h-14 rounded-lg object-cover flex-shrink-0"/>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-900 truncate">{page.name}</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                         className="lucide lucide-check-circle w-4 h-4 text-blue-500 flex-shrink-0">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <path d="m9 11 3 3L22 4"></path>
                                    </svg>
                                </div>
                                <div className="flex items-center gap-3 mt-1"></div>
                                <p className="text-sm text-gray-500 mt-1">{page.category}</p>
                            </div>
                        </div>
                        <div className="sm:ml-auto">
                            <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">{page.status}</span>
                        </div>
                    </div>


                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                     className="lucide lucide-users w-5 h-5 text-blue-500">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium">{page.follows}</div>
                                <div className="text-xs text-gray-500">followers</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                     className="lucide lucide-share2 w-5 h-5 text-purple-500">
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                                    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium">{page.interactions}</div>
                                <div className="text-xs text-gray-500">tương tác</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                     className="lucide lucide-eye w-5 h-5 text-green-500">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium">{page.approach}</div>
                                <div className="text-xs text-gray-500">tiếp cận</div>
                            </div>
                        </div>

                        {/*<div className="flex items-center gap-2">*/}
                        {/*    <div className="p-2 bg-orange-50 rounded-lg">*/}
                        {/*        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"*/}
                        {/*             viewBox="0 0 24 24" fill="none" stroke="currentColor"*/}
                        {/*             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"*/}
                        {/*             className="lucide lucide-message-square w-5 h-5 text-orange-500">*/}
                        {/*            <path*/}
                        {/*                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>*/}
                        {/*        </svg>*/}
                        {/*    </div>*/}
                        {/*    <div>*/}
                        {/*        <div className="font-medium">94.8%...</div>*/}
                        {/*        <div className="text-xs text-gray-500">phản hồi</div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                     className="lucide lucide-file-text w-5 h-5 text-red-500">
                                    <path
                                        d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                    <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                                    <path d="M10 9H8"></path>
                                    <path d="M16 13H8"></path>
                                    <path d="M16 17H8"></path>
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium">{page.posts}</div>
                                <div className="text-xs text-gray-500">bài viết</div>
                            </div>
                        </div>

                    </div>

            </div>
            </div>


    )
}

export default PageCard;