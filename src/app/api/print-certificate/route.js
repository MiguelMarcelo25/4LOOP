export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const businessDetail = await req.json();
        const requestUrl = new URL(req.url);
        const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
        const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
        const host = forwardedHost || requestUrl.host;
        const protocol = forwardedProto || requestUrl.protocol.replace(":", "");
        const origin = `${protocol}://${host}`;

        // 1. Map the variables
        const dateIssued = businessDetail.createdAt
            ? new Date(businessDetail.createdAt).toLocaleDateString()
            : "";

        let inspectorName = "";
        let dateTimeInspected = "";

        if (
            businessDetail.inspectionRecords &&
            businessDetail.inspectionRecords.length > 0
        ) {
            inspectorName =
                businessDetail.inspectionRecords[0]?.officerInCharge?.fullName || "";
            dateTimeInspected = new Date(
                businessDetail.inspectionRecords[0]?.inspectionDate
            ).toLocaleString();
        } else {
            inspectorName = businessDetail.officerInCharge?.fullName || "";
        }

        const {
            bidNumber = "",
            businessName = "",
            businessAddress = "",
            spNumber = "",
        } = businessDetail;

        const yearNoStr = new Date().getFullYear().toString().slice(-2);
        const pasigLogoUrl = `${origin}/pasig-logo.png`;
        const pasigDeptLogoUrl = `${origin}/pasig-env.png`;
        const sealLogoUrl = `${origin}/pasig-seal.png`;

        // 3. Exact HTML payload based on Certificate.html
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <base href="${origin}/">
    <title>Sanitary Permit to Operate - Pasig City</title>
    <style>
        @page { size: Letter; margin: 0; }
        :root {
            --primary-font: 'Arial', sans-serif;
            --title-font: 'Times New Roman', serif;
            --border-color: #000;
        }

        body {
            background-color: #fff;
            display: flex;
            justify-content: center;
            padding: 0;
            margin: 0;
            font-family: var(--primary-font);
            font-size: 11px;
            line-height: 1.4;
        }

        .permit-container {
            width: 8.5in;
            height: 11in;
            padding: 40px;
            position: relative;
            box-sizing: border-box;
        }

        /* Header Section */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .logos-left {
            display: flex;
            gap: 10px;
        }

        .logo-placeholder {
            width: 60px;
            height: 60px;
            background-color: #eee;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            border: 1px solid #ccc;
        }

        .header-text {
            text-align: center;
            flex-grow: 1;
            text-transform: uppercase;
            font-weight: bold;
        }

        .header-text span {
            display: block;
            font-size: 10px;
        }

        /* Main Title */
        .main-title {
            text-align: center;
            margin: 20px 0;
        }

        .main-title h1 {
            font-family: var(--title-font);
            font-size: 32px;
            margin: 0;
            letter-spacing: 2px;
            font-weight: 900;
        }

        .main-title p {
            margin: 5px 0;
            font-style: italic;
            font-weight: bold;
        }

        /* Form Fields */
        .field-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }

        .input-line {
            border-bottom: 1px solid var(--border-color);
            padding: 0 5px;
            display: inline-block;
            text-align: center;
            font-weight: bold;
        }

        .full-width-field {
            text-align: center;
            margin: 20px 0;
            border-bottom: 1px solid var(--border-color);
        }

        .label-sub {
            display: block;
            text-align: center;
            font-size: 9px;
            text-transform: uppercase;
            margin-top: 2px;
        }

        /* Body Content */
        .body-content {
            text-align: justify;
            margin-top: 25px;
        }

        .body-content p {
            margin-bottom: 15px;
            text-indent: 40px;
        }

        /* Signatures */
        .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin-top: 40px;
            gap: 40px;
        }

        .sig-block {
            text-align: center;
        }

        .sig-name {
            font-weight: bold;
            text-decoration: underline;
            display: block;
        }

        .sig-title {
            font-size: 9px;
            display: block;
        }

        /* Inspector Section */
        .inspector-section {
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }

        /* Footer */
        .footer {
            text-align: center;
            margin-top: 40px;
            font-weight: bold;
        }

        .slogan {
            font-style: italic;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .notice {
            font-size: 10px;
        }

        .inspector-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr 1fr; /* Gives the name field more room */
            gap: 20px;
            align-items: end; /* Ensures all lines align at the bottom */
            margin-top: 20px;
        }

        .input-group {
            display: flex;
            flex-direction: column;
        }

        .input-group .field-label {
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>

<div class="permit-container">
    <div class="header">
        <div class="logos-left">
            <img src="${pasigLogoUrl}" alt="Pasig Logo" loading="eager" decoding="sync" style="width: 50px; height: 50px; object-fit: contain;" />
            <img src="${pasigDeptLogoUrl}" alt="Pasig Dept Logo" loading="eager" decoding="sync" style="width: 50px; height: 50px; object-fit: contain;" />
        </div>
        <div class="header-text">
            <span>Republic of the Philippines</span>
            <span>City of Pasig</span>
            <span>City Health Department</span>
            <span>Environmental Sanitation Section</span>
        </div>
        <img src="${sealLogoUrl}" alt="Pasig Seal" loading="eager" decoding="sync" style="width: 50px; height: 50px; object-fit: contain;" />
    </div>

    <div class="field-row">
        <div>BID NUMBER: <span class="input-line" style="width: 150px; font-size: 12px; color: #b91c1c;">${bidNumber}</span></div>
        <div>SP NO. <span class="input-line" style="width: 120px; font-size: 12px; color: #b91c1c;">${spNumber || ""}</span></div>
    </div>

    <div class="main-title">
        <h1>SANITARY PERMIT TO OPERATE</h1>
        <p>IS HEREBY GRANTED TO</p>
    </div>

    <div class="full-width-field" style="border-bottom: none; margin: 10px 0;">
        <span class="input-line" style="width: 100%; display: block; font-size: 18px; text-transform: uppercase;">${businessName}</span>
        <span class="label-sub">BUSINESS NAME</span>
    </div>

    <div class="full-width-field" style="border-bottom: none; margin: 10px 0;">
        <span class="input-line" style="width: 100%; display: block; font-size: 14px; text-transform: uppercase;">${businessAddress}</span>
        <span class="label-sub">BUSINESS ADDRESS</span>
    </div>

    <div class="field-row" style="margin-top: 20px;">
        <div style="width: 50%;">DATE ISSUED: <span class="input-line" style="width: 70%;">${dateIssued}</span></div>
        <div style="width: 40%; text-align: right;">VALID UNTIL DECEMBER 31, 20<span class="input-line" style="width: 40px;">${yearNoStr}</span></div>
    </div>

    <div class="body-content">
        <p>This Sanitary Permit is instantly issued to covered Establishments as mandated and provided for by the Code on Sanitation of the Philippines (P.D. 856), City Ordinance No. 53 Series of 2022, amending the Sanitation Code of Pasig City (City Ordinance No.15 Series of 2008) accordingly, R.A. 11032, the Ease of Doing Business and Efficient Delivery of Government Services in furtherance of R.A. 9485 or the Anti-Red Tape Act of 2007, the Joint Memorandum Circular (JMC No.01 Series of 2021) of the Anti-Red Tape Authority (ARTA), DILG, DTI and DICT and the Citizen's Charter of Pasig City.</p>

        <p>Explicit to the issuance of this permit is the condition that all applicable <strong>Minimum Sanitary Requirements (MSR)</strong> shall be fully complied. Likewise, <strong>this Permit shall not exempt the Grantee from compliance with the permitting requirements of other Government Agencies and Offices</strong>, both from the Local Government Unit and National Agencies.</p>

        <p>Accordingly, the Penal Provisions of aforesaid Laws and Ordinances shall be in full effect and applied to, for any violations and non-compliance regardless of the absence of a post-audit or inspection by our Office. <strong>The mere possession of this Sanitary Permit is construed that you understand and are properly informed of the requirements to be complied.</strong></p>
    </div>

    <div class="signature-section">
        <div class="sig-block" style="text-align: left;">
            <p>Recommending Approval:</p>
            <br>
            <span class="sig-name">NORA T. DANCEL, M.D., DPPS</span>
            <span class="sig-title">OIC, Environmental Sanitation Section</span>
        </div>
        <div class="sig-block" style="text-align: right;">
            <p>Approved:</p>
            <br>
            <span class="sig-name">JOSEPH R. PANALIGAN, M.D., MHA</span>
            <span class="sig-title">City Health Officer</span>
        </div>
    </div>

    <div class="inspector-section">
        <div class="inspector-grid">
            <div class="input-group">
                <span class="field-label">INSPECTED BY:</span>
                <span class="input-line" style="width: 100%; height: 18px;">${inspectorName}</span>
                <span class="label-sub">Name of Sanitary Inspector</span>
            </div>

            <div class="input-group">
                <span class="field-label">SIGNATURE:</span>
                <span class="input-line" style="width: 100%; height: 18px;"></span>
                <span class="label-sub">&nbsp;</span> 
            </div>

            <div class="input-group">
                <span class="field-label">DATE/TIME:</span>
                <span class="input-line" style="width: 100%; height: 18px; font-size: 10px;">${dateTimeInspected}</span>
                <span class="label-sub">&nbsp;</span> 
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="slogan">"A GAME CHANGER IN CONDUCTING BUSINESS TRANSACTIONS IN PASIG CITY"</div>
        <div class="notice">
            This Sanitary Permit is <strong>NON-TRANSFERABLE</strong> and shall be <strong>DISPLAYED IN PUBLIC VIEW</strong>.<br>
            <em>Your Establishment is SUBJECT FOR INSPECTION</em>
        </div>
    </div>
</div>

</body>
</html>
        `;

        // Return the fully populated HTML to the frontend for native browser printing
        return NextResponse.json({ html: htmlContent }, { status: 200 });

    } catch (error) {
        console.error("Error generating print certificate output:", error);
        return NextResponse.json(
            { error: "Failed to generate Certificate" },
            { status: 500 }
        );
    }
}

