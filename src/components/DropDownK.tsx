// import React from "react";
// import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
// import { Menu, ChevronDown, LogOut, Settings } from "lucide-react";

import ViolationsPage from "../pages/ViolationsPage.tsx";
import NewPostsPage from "../pages/NewPostsPage.tsx";
import ContentModerationPage from "../pages/ContentModerationPage.tsx";
import LoginPage from "../pages/LoginPage.tsx";
import RegisterPage from "../pages/RegisterPage.tsx";

const DropdownK = () => {
    return (
        <div style={{display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center"}}>
            <div><ContentModerationPage /></div>
            <div><LoginPage /></div>
            <div><NewPostsPage /></div>
            <div><RegisterPage /></div>
            <div><ViolationsPage /></div>
        </div>
    );
};

export default DropdownK;
