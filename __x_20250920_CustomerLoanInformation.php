<?php
include 'Modules/DbConnection.php';
include 'Get_PTNo.php';

$releaseDate = date("Y-m-d");
$loanDate = date("Y-m-d");
$loanAmount = 0;
$RateInterest = 0;
$percentage = 0;
$interestAmount = 0;
$totalAmount = 0;
$amountInWords = '';
$ornamentImg = '';
$pt_no = '';
$ActualDays = '';
$CalculatedDays = '';
$years = $months = $days = 0;
$customerImage = '';
$dbPath = '';
// $imagedata = '';
$accessConn = '';
$pdocon = '';

$selected_svf = isset($_POST['svf']) ? $_POST['svf'] : 'pnl'; // default to 'pnl'

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $pt_no = mysqli_real_escape_string($conn, $_POST['txtPTno'] ?? '');
    $company = mysqli_real_escape_string($conn, $_POST['svf'] ?? '');


    if ($pt_no == '') {

        echo "<script>alert('Please Enter PT Number..');</script>";

    }

    if ($company == '') {
        echo "<script>alert('Please Select Company..');</script>";
    }

    if ($pt_no != '' && $company != '') {

        if ($company === 'pnl') {

            //  $checkptno = "Select pt_no,customer_id, cast(account_opening_date as date) as Tdate,interest_rate,loan_amount,branch_id,jewel_photo from svf_jl_accounts where pt_no = '$pt_no'";
            $checkptno = "Select j.pt_no,j.customer_id,c.photo_file, cast(j.account_opening_date as date) as Tdate,j.interest_rate,j.loan_amount,j.branch_id,j.jewel_photo from svf_jl_accounts as j, svf_customers as c where j.customer_id=c.entryid and pt_no = '$pt_no'";

            $result = mysqli_query($conn, $checkptno);

            if ($result->num_rows > 0) {

                $row = mysqli_fetch_assoc($result);

                $loanAmount = $row['loan_amount'] ?? 0;
                $RateInterest = $row['interest_rate'] ?? 0;
                $percentage = $RateInterest / 12;
                $loanDate = $row['Tdate'] ?? date("Y-m-d");
                $releaseDate = date("Y-m-d");

                $imagedata = $row['photo_file'];
                $imagesize = strlen($imagedata);

                if ($imagesize > 200) {
                    // It's likely a binary image (BLOB)
                    $customerImage = "data:image/png;base64," . base64_encode($imagedata);
                    $customerImage = 'uploads/' . $customerImage;
                } else {
                    // It's a filename
                    $customerImage = $imagedata;
                    $customerImage = 'uploads/' . $customerImage ?? '';
                }

                $interestData = calculateInterest($loanDate, $releaseDate, $loanAmount, $percentage);

                $interestAmount = $interestData['interest'];
                $totalAmount = $interestData['total'];
                $ActualDays = $interestData['actualdays'];
                $CalculatedDays = $interestData['duration'];

                if (!empty($CalculatedDays)) {
                    preg_match('/(\d+)\s+Year/', $CalculatedDays, $yMatch);
                    preg_match('/(\d+)\s+Month/', $CalculatedDays, $mMatch);
                    preg_match('/(\d+)\s+Day/', $CalculatedDays, $dMatch);

                    $years = $yMatch[1] ?? 0;
                    $months = $mMatch[1] ?? 0;
                    $days = $dMatch[1] ?? 0;
                }


                // $ornamentImg = $row['jewel_photo'] ?? '';
                $ornamentImg = $row['jewel_photo'] ?? '';

                $ornamentImg = 'uploads/' . $ornamentImg ?? '';

            }

        } else {
            $accessConn = getAccessConnection($company, $dbPath);

            if ($accessConn) {
                $query = "Select MID,AppID,LoanAmount,Interest,TDate,Branch from tblTranmast Where TID= '$pt_no'";
                $stmt = $accessConn->prepare($query);
                $stmt->execute([$pt_no]);

                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($row) {

                    $loanAmount = $row['LoanAmount'];
                    $RateInterest = $row['Interest'];
                    $percentage = $RateInterest / 12;
                    $loanDate = $row['TDate'];
                    $loanDate = date("Y-m-d", strtotime($loanDate));
                    $releaseDate = date("Y-m-d");
                    $customerid = $row['MID'];
                    $AppraiserID = $row['AppID'];

                    $interestData = calculateInterest($loanDate, $releaseDate, $loanAmount, $percentage);

                    $interestAmount = $interestData['interest'];
                    $totalAmount = $interestData['total'];
                    $ActualDays = $interestData['actualdays'];
                    $CalculatedDays = $interestData['duration'];

                    $loanAmount = formatIndianNumber($loanAmount);
                    $RateInterest = intval($RateInterest);

                    if (!empty($CalculatedDays)) {
                        preg_match('/(\d+)\s+Year/', $CalculatedDays, $yMatch);
                        preg_match('/(\d+)\s+Month/', $CalculatedDays, $mMatch);
                        preg_match('/(\d+)\s+Day/', $CalculatedDays, $dMatch);

                        $years = $yMatch[1] ?? 0;
                        $months = $mMatch[1] ?? 0;
                        $days = $dMatch[1] ?? 0;
                    }

                    // $imagepath = str_replace($dbPath, "DB.mdb", "" );
                    $imagepath = dirname($dbPath) . DIRECTORY_SEPARATOR;

                    $customerImage = $imagepath . "Photos\\" . $customerid . ".jpg" ?? '';

                    $CusttargetPath = "Database/TempImg/tempCustomer.jpg";

                    if (file_exists($customerImage)) {
                        if (file_exists($CusttargetPath)) {
                            unlink($CusttargetPath);
                        }
                        copy($customerImage, $CusttargetPath);
                        $customerImage = $CusttargetPath;
                    } else {
                        $customerImage = 'Database/TempImg/Empty.jpg';
                    }

                    $ornamentImg = $imagepath . "Ornaments\\" . $AppraiserID . ".jpg" ?? '';

                    $OrntargetPath = "Database/TempImg/tempOrn.jpg";

                    if (file_exists($ornamentImg)) {
                        if (file_exists($OrntargetPath)) {
                            unlink($OrntargetPath);
                        }
                        copy($ornamentImg, $OrntargetPath);
                        $ornamentImg = $OrntargetPath;
                    } else {
                        $ornamentImg = 'Database/TempImg/Empty.jpg';
                    }

                    // $stmt = $accessConn->prepare($query);
                    // $stmt->execute([$pt_no]);
                    // $row = $stmt->fetch(PDO::FETCH_ASSOC);

                    if ($row) {
                        // Use $row['loan_amount'], etc.
                    } else {
                        echo "<script>alert('PT Number not found');</script>";
                    }
                }
            }
        }
    }
}

function getAccessConnection($company, &$dbPath)
{

    switch ($company) {
        case 'svf-dc':
            $dbPath = '\\\\svf-deviserv\\D\\svf\\Database\\DB.mdb';
            break;
        case 'sai-mr':
            $dbPath = '\\\\svf-mser\\d\\svfsai\\database\\DB.mdb';
            break;
        case 'svf-pnr':
            $dbPath = '\\\\192.168.65.106\\d\\sadaa\\database\\DB.mdb';
            break;
        case 'mfl':
            $dbPath = '\\\\svf-mser\\d\\mapakshi\\database\\DB.mdb';
            break;
        default:
            $dbPath = '';
            return null;
    }
    try {
        $pdocon = new PDO("odbc:Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=" . $dbPath . ";Uid=admin;Pwd=svf04130416;");
        $pdocon->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdocon;
        // return [$pdocon, $dbPath]; 

    } catch (PDOException $e) {
        die("Connection Failed: " . $e->getMessage());
    }
}

?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="Css/Style.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #e6f0ff, #f8fbff);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 6px;
            font-size: 12px;
        }

        .page-container {
            width: 100%;
            max-width: 860px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }

        .header {
            background: #2c3e50;
            color: white;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header h2 {
            font-size: 1.1rem;
            font-weight: 500;
        }

        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }

        .close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .form-container {
            padding: 12px;
        }

        .image-section {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
        }

        .image-box {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 6px;
            text-align: center;
            background: #f9f9f9;
            flex: 1;
        }

        .image-box label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
            color: #444;
            font-size: 11px;
        }

        .image-placeholder {
            width: 100%;
            height: 90px;
            background: #eee;
            border: 1px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            overflow: hidden;
        }

        .image-placeholder img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .details-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .date-row {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
        }

        .date-group {
            flex: 1;
        }

        .date-group label {
            display: block;
            margin-bottom: 3px;
            font-weight: 500;
            color: #444;
            font-size: 11px;
        }

        .date-input {
            width: 100%;
            padding: 6px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 12px;
        }

        .loan-details {
          border: 2px solid #009688;
          border-radius: 10px;
          padding: 20px;
          background: #f9fdfc;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }

        .loan-details legend {
          font-weight: bold;
          color: #009688;
          font-size: 1.2rem;
          padding: 0 10px;
        }

        .loan-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
          gap: 15px;
          margin-top: 10px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 0.9rem;
          margin-bottom: 5px;
          color: #333;
        }

        .form-group input {
          padding: 8px 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          background: #fff;
          font-size: 0.95rem;
        }

        .form-group input[readonly] {
          background: #f1f1f1;
          color: #555;
        }

        .amount-words {
          margin-top: 15px;
          padding: 10px;
          background: #e0f2f1;
          border-radius: 6px;
          font-style: italic;
          color: #00695c;
          text-align: center;
        }

        .amount-row {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;
            flex-wrap: wrap;
        }

        .amount-row label {
            font-weight: 500;
            color: #d35400;
            font-size: 11px;
            min-width: 60px;
        }

        .amount-input {
            width: 65px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
            text-align: center;
            font-weight: bold;
            background: #fff;
            font-size: 11px;
        }

        .amount-words {
            background: #27ae60;
            color: white;
            padding: 5px 8px;
            border-radius: 3px;
            font-size: 11px;
            margin-top: 5px;
            min-height: 26px;
        }

        .pt-section {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            background: #f9f9f9;
            margin-bottom: 10px;
        }

        .pt-input {
            width: 100%;
            padding: 6px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 12px;
            text-align: center;
        }

        .radio-group {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .radio-group label {
            display: flex;
            align-items: center;
            gap: 3px;
            font-size: 11px;
            cursor: pointer;
        }

        .duration-section {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            background: #f9f9f9;
            margin-bottom: 10px;
        }

        .days-label {
            background: #e74c3c;
            color: white;
            padding: 5px 8px;
            border-radius: 3px;
            display: inline-block;
            margin-bottom: 6px;
            font-size: 11px;
        }

        .duration-inputs {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }

        .duration-box {
            display: flex;
            align-items: center;
            gap: 3px;
        }

        .duration-input {
            width: 40px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
            text-align: center;
            font-weight: bold;
            background: #fff;
            font-size: 11px;
        }

        .duration-label {
            font-size: 11px;
            color: #2980b9;
            font-weight: 500;
        }

        .funding-section {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 6px;
            flex-wrap: wrap;
        }

        .funding-label {
            background: #f39c12;
            color: white;
            padding: 5px 8px;
            border-radius: 3px;
            font-size: 11px;
        }

        .amount-display {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .amount-display label {
            font-weight: 500;
            color: #2980b9;
            font-size: 11px;
        }

        .amount-value {
            width: 80px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
            text-align: center;
            font-weight: bold;
            background: #fff;
            font-size: 11px;
        }

        .buttons-row {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid #eee;
        }

        .action-btn {
            padding: 6px 16px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-exit {
            background: #e74c3c;
            color: white;
        }

        .btn-exit:hover {
            background: #c0392b;
        }

        .btn-show {
            background: #3498db;
            color: white;
        }

        .btn-show:hover {
            background: #2980b9;
        }

        .compact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .compact-section {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 8px;
            background: #f9f9f9;
        }

        @media (max-width: 800px) {
            .image-section {
                flex-direction: column;
            }

            .page-container {
                max-width: 95%;
            }

            .compact-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 500px) {
            .date-row {
                flex-direction: column;
                gap: 6px;
            }

            .amount-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 3px;
            }

            .duration-inputs {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }

            .funding-section {
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
            }

            .form-container {
                padding: 10px;
            }

            .action-btn {
                padding: 5px 12px;
            }

            .image-placeholder {
                height: 80px;
            }
        }
    </style>


</head>

<body class="CustomerLoanInformBody">
    <div class="page-container">
        <div class="header">
            <h2>Customer Loan Information</h2>
            <button class="close-btn" onclick="closeWindow()">&times;</button>
        </div>

        <form method="Post" action="#" id="CustomerLoanInformform">
            <div class="form-container">
                <!-- Images Side by Side -->
                <div class="image-section">
                    <div class="image-box">
                        <label for="CustomerPhoto">Customer Photo</label>
                        <div class="image-placeholder">
                            <img src="<?= $customerImage !== '' ? $customerImage : 'Database/TempImg/Empty.jpg' ?>"
                                id="CustomerPhoto" alt="Customer Photo">
                        </div>
                    </div>

                    <div class="image-box">
                        <label for="OrnPhoto">Ornament Photo</label>
                        <div class="image-placeholder">
                            <img src="<?= $ornamentImg !== '' ? $ornamentImg : 'Database/TempImg/Empty.jpg' ?>"
                                id="OrnPhoto" alt="Ornament Photo">
                        </div>
                    </div>
                </div>

                <!-- Compact Grid Layout -->
                <div class="compact-grid">
                    <!-- Left Column -->
                    <div class="details-section">
                        <!-- Dates -->
                        <div class="date-row">
                            <div class="date-group">
                                <label for="loanDate">Loan Date</label>
                                <input type="date" id="loanDate" name="loanDate" class="date-input"
                                    value="<?= $loanDate ?>">
                            </div>
                            <div class="date-group">
                                <label for="releaseDate">Release Date</label>
                                <input type="date" id="releaseDate" name="releaseDate" class="date-input"
                                    value="<?= $releaseDate ?>">
                            </div>
                        </div>

                        <!-- Loan Details -->
                        <fieldset class="loan-details">
                            <legend>Loan Details</legend>

                            <div class="loan-grid">
                                <div style="display: flex; flex-direction: row; gap: 50px;">
                                    <div class="form-group">
                                        <label for="txtloanAmount">Loan Amount</label>
                                        <input style="width: 120px;" type="text" id="txtloanAmount" name="txtloanAmount" value="<?= $loanAmount ?>"
                                            readonly>
                                    </div>

                                    <div class="form-group">
                                        <label for="txtroi">ROI</label>
                                        <input style="width: 50px;" type="text" id="txtroi" name="txtroi" value="<?= $RateInterest ?>" readonly>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="txtpercent">ROI in %</label>
                                        <input style="width: 50px;" type="text" id="txtpercent" name="txtpercent" value="<?= $percentage ?>"
                                        readonly>
                                    </div>
                                </div>
                            </div>

                            <div id="AmtInWords" class="amount-words">
                                <?= $amountInWords ?>
                            </div>
                        </fieldset>
                    </div>

                    <!-- Right Column -->
                    <div class="details-section">
                        <!-- PT Number Input -->
                        <fieldset class="pt-section">
                            <legend>Enter PT Number</legend>
                            <input type="text" id="txtPTno" name="txtPTno" inputmode="numeric" pattern="[0-9]*"
                                class="pt-input" value="<?= $pt_no ?>" placeholder="Enter PT Number">

                            <div class="radio-group">
                                <label>
                                    <input type="radio" id="svf-dc" name="svf" value="svf-dc" <?php if ($selected_svf == 'svf-dc')
                                        echo 'checked'; ?>>SVF-DC
                                </label>
                                <label>
                                    <input type="radio" id="sai-mr" name="svf" value="sai-mr" <?php if ($selected_svf == 'sai-mr')
                                        echo 'checked'; ?>>SAI-MR
                                </label>
                                <label>
                                    <input type="radio" id="svf-pnr" name="svf" value="svf-pnr" <?php if ($selected_svf == 'svf-pnr')
                                        echo 'checked'; ?>>SVF-PNR
                                </label>
                                <label>
                                    <input type="radio" id="mfl" name="svf" value="mfl" <?php if ($selected_svf == 'mfl')
                                        echo 'checked'; ?>>MFL
                                </label>
                                <label>
                                    <input type="radio" id="pnl" name="svf" value="pnl" <?php if ($selected_svf == 'pnl')
                                        echo 'checked'; ?>>PNL
                                </label>
                            </div>
                        </fieldset>

                        <!-- Duration -->
                        <div class="duration-section">
                            <div class="days-label"><?= !empty($ActualDays) ? $ActualDays : '0 Days' ?></div>

                            <div class="duration-inputs">
                                <div class="duration-box">
                                    <input type="text" class="duration-input" id="txtyears" name="txtyears"
                                        value="<?= $years ?>" readonly>
                                    <span class="duration-label">Year(s)</span>
                                </div>

                                <div class="duration-box">
                                    <input type="text" class="duration-input" id="txtMonth" name="txtMonth"
                                        value="<?= $months ?>" readonly>
                                    <span class="duration-label">Month(s)</span>
                                </div>

                                <div class="duration-box">
                                    <input type="text" class="duration-input" id="txtDay" name="txtDay"
                                        value="<?= $days ?>" readonly>
                                    <span class="duration-label">Day(s)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Funding Chart -->
                <div class="funding-section">
                    <div class="funding-label">Funding Chart</div>

                    <div class="amount-display">
                        <label for="txtIntAmount">Interest Amount:</label>
                        <input type="text" id="txtIntAmount" name="txtIntAmount" class="amount-value"
                            value="<?= $interestAmount ?>" readonly>
                    </div>

                    <div class="amount-display">
                        <label for="txtTotAmount">Total Amount:</label>
                        <input type="text" id="txtTotAmount" name="txtTotAmount" class="amount-value"
                            value="<?= $totalAmount ?>" readonly>
                    </div>
                </div>

                <!-- Buttons -->
                <div class="buttons-row">
                    <button type="button" class="action-btn btn-exit" id="btnExit" name="btnExit">Exit</button>
                    <button type="Submit" class="action-btn btn-show" id="btnShow" name="btnShow">Show</button>
                </div>
            </div>
        </form>
    </div>

    <script>
        $(document).ready(function () {

            window.onload = function () {
                document.getElementById('txtPTno').focus();

                let initialAmount = $('#txtloanAmount').val().trim();
                if (initialAmount !== '') {
                    let cleanAmount = initialAmount.replace(/,/g, '');
                    let words = numberToWords(cleanAmount);
                    $('#AmtInWords').text(words);
                }
            };

            $('#btnExit').on('click', function () {
                closeWindow();
            });

            document.querySelector('#txtPTno').addEventListener('keypress', function (e) {
                const key = e.key;
                const regex = /^[0-9]$/;
                if (!regex.test(key)) {
                    e.preventDefault();
                    return;
                }
            });

            $('#txtPTno').on('keydown', function (e) {
                if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
                    e.preventDefault(); // Prevent default tab or enter behavior
                    $('#btnShow').focus();
                }
            });
        });

        function closeWindow() {
            if (confirm("Are you sure you want to exit?")) {
                window.top.location.href = "Appraiser.php";
            }
        }

        function numberToWords(num) {
            const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
            const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

            function convertToWords(n) {
                if (n < 20) return ones[n];
                if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
                if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convertToWords(n % 100) : "");
                if (n < 100000) return convertToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convertToWords(n % 1000) : "");
                if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convertToWords(n % 100000) : "");
                return convertToWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convertToWords(n % 10000000) : "");
            }

            if (isNaN(num) || num == '') return '';
            if (num == 0) return 'Zero Rupees Only';

            return convertToWords(parseInt(num)) + " Rupees Only";
        }
    </script>
</body>

</html>