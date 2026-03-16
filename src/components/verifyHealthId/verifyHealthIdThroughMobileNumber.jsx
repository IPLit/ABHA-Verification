import React, {useEffect, useState} from "react";
import {
    fetchPatientFromBahmniWithHealthId,
    searchAbhaByMobile,
    profileLoginRequestOtp,
    profileLoginVerify,
    getPatientProfile
} from '../../api/hipServiceApi';
import Spinner from '../spinner/spinner';
import './verifyHealthId.scss';
import {checkIfNotNull} from "./verifyHealthId";
import {mapPatient} from "../Common/patientMapper";
import { validateMobileNumber, validateOtp } from "../Common/FormatAndValidationUtils";
import ResendOtp from "../Common/ResendOtp";

const VerifyHealthIdThroughMobileNumber = (props) => {
    const [mobileNumber, setMobileNumber] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [linkedABHANumber, setLinkedABHANumber] = useState([]);
    const [matchingPatientFound, setMatchingPatientFound] = useState(false);
    const [matchingpatientUuid, setMatchingPatientUuid] = useState('');
    const [showError, setShowError] = useState(false);
    const [loader, setLoader] = useState(false);
    const [back, setBack] = useState(false);
    const [isHealthIdNotLinked, setIsHealthIdNotLinked] = useState(false);
    const [error, setError] = useState('');
    const [selectedABHA, setSelectedABHA] = useState({});
    const [showResendSuccessMessage, setShowResendSuccessMessage] = useState(false);
    const [searchTxnId, setSearchTxnId] = useState('');

    function idOnChangeHandler(e) {
        setShowError(false);
        setError('');
        setMobileNumber(e.target.value);
        setShowOtpInput(false);
    }

    function otpOnChangeHandler(e) {
        setOtp(e.target.value);
    }

    async function onResendOtp() {
        setError("");
        setShowError(false);
        await requestOtpForSelectedAbha(true);
    }

    async function verifyMobileNumber() {
        let formattedMobileNumber = mobileNumber.trim();
        if(!validateMobileNumber(formattedMobileNumber)){
            setShowError(true);
            setError("Invalid Mobile Number. Mobile Number should be 10 digits");
            return;
        }
        setError('');
        setLoader(true);
        setShowError(false);
        const response = await searchAbhaByMobile(formattedMobileNumber);
        if (response && response.data !== undefined) {
            const abhaList = response.data.abhaList || [];
            setLinkedABHANumber(abhaList);
            setSearchTxnId(response.data.txnId || '');
            props.setIsDisabled(true);
        } else {
            setShowError(true);
            setError(response?.error?.message);
        }
        setLoader(false);
    }

    async function verifyOtp() {
        setError('');
        setShowError(false);
        if (!validateOtp(otp)) {
            setShowError(true);
            setError("Invalid OTP. OTP should be 6 digits");
        } else {
            setLoader(true);
            const verifyResponse = await profileLoginVerify(otp, searchTxnId);
            if (!verifyResponse || verifyResponse.data === undefined) {
                setLoader(false);
                setShowError(true);
                setError(verifyResponse?.error?.message || "Unable to verify OTP. Please try again.");
            } else {
                props.setIsMobileOtpVerified(true);
                setLoader(false);
                if (verifyResponse && verifyResponse.data !== undefined) {
                    props.setNdhmDetails(mapPatient(verifyResponse.data));
                }
            }
        }
    }

    function redirectToPatientDashboard() {
        window.parent.postMessage({"patientUuid" : matchingpatientUuid}, "*");
    }

    function prepareMatchingPatientsList() {
        return linkedABHANumber.map((patient, i) => {
            return (
                <button onClick={() => setSelectedABHA(linkedABHANumber[i])} className={selectedABHA === patient ? "active" : "abha-list"}>
                    <p>
                        <strong>{patient?.name?.replace(null,"")} </strong>
                        {patient?.gender && <span><br/>Gender: {patient.gender}</span>}
                         <span><br/>ABHA Number: {patient.abhaNumber}</span>
                        {patient?.index !== undefined && <span><br/>Index: {patient.index}</span>}
                    </p>
                </button>
            );
        });
    }

    useEffect(async () => {
        setIsHealthIdNotLinked(false);
        setMatchingPatientFound(false);
        if (checkIfNotNull(selectedABHA)) {
            if (selectedABHA.abhaNumber === "") {
                setIsHealthIdNotLinked(true);
            }
            if(selectedABHA.abhaNumber !== "") {
                const matchingPatientId = await fetchPatientFromBahmniWithHealthId(selectedABHA.abhaNumber);
                if (matchingPatientId.Error === undefined && matchingPatientId.validPatient === true) {
                    setMatchingPatientFound(true);
                    setMatchingPatientUuid(matchingPatientId.patientUuid);
                } else {
                    if (matchingPatientId.Error !== undefined) {
                        setShowError(true);
                        setError(matchingPatientId.Error.message);
                    }
                }
            }
        }
    },[selectedABHA])

    async function requestOtpForSelectedAbha(isResend = false) {
        if (!checkIfNotNull(selectedABHA)) {
            setShowError(true);
            setError("Please select an ABHA ID from the list.");
            return;
        }
        if (!searchTxnId) {
            setShowError(true);
            setError("Search transaction is missing. Please search again.");
            return;
        }
        setError('');
        setLoader(true);
        setShowError(false);
        const response = await profileLoginRequestOtp(selectedABHA.index, searchTxnId);
        setLoader(false);
        if (!response || response.data === undefined) {
            setShowError(true);
            setError(response?.error?.message || "Unable to send OTP. Please try again.");
        } else {
            setShowOtpInput(true);
            if (isResend) {
                setShowResendSuccessMessage(true);
                setTimeout(()=>{setShowResendSuccessMessage(false);},3000);
            }
        }
    }

    useEffect(() => {
        if(back) {
            setMobileNumber('');
            setOtp('');
            setError('');
            setShowOtpInput('');
            setLinkedABHANumber([]);
            setSelectedABHA({});
            props.setIsMobileOtpVerified(false);
            props.setBack(true);
        }
    },[back])



    return (
        <div>
        {!checkIfNotNull(props.ndhmDetails) &&
            <div>
                {linkedABHANumber.length === 0 && <div>
                    <div className="verify-health-id">
                        <label htmlFor="mobileNumber" className="label">Enter Mobile Number: </label>
                        <div className="verify-health-id-input-btn">
                            <div className="verify-health-id-input">
                                <input type="text" id="mobileNumber" name="mobileNumber" value={mobileNumber} onChange={idOnChangeHandler} />
                            </div>
                            <button name="verify-btn" type="button" onClick={verifyMobileNumber} disabled={props.isDisabled || showOtpInput}>Search</button>
                            {!showOtpInput && showError && <h6 className="error ">{error}</h6>}
                        </div>
                    </div>
                    {loader && <Spinner />}
                </div>}
                {linkedABHANumber.length > 0 &&
                <div>
                    <h3>ABHA numbers found for the given mobile number. Please select one of the following</h3>
                    {prepareMatchingPatientsList()}
                    {matchingPatientFound && <div className="patient-existed" onClick={redirectToPatientDashboard}>
                        Matching record with Health ID/PHR Address found
                    </div>}
                    {isHealthIdNotLinked && <div className="note health-id">
                        ABHA Number doesn't have ABHA Address linked.
                        Click on proceed to create new ABHA Address.
                    </div>}
                    {showOtpInput &&
                        <div>
                            <div className="otp-verify" >
                                <label htmlFor="otp">Enter OTP </label>
                                <div className="otp-verify-input-btn" >
                                    <div className="otp-verify-input">
                                        <input type="text" id="otp" name="otp" value={otp} onChange={otpOnChangeHandler} />
                                    </div>
                                    <ResendOtp onResend={onResendOtp} />
                                    {showResendSuccessMessage && <div className="success_text">OTP Sent Successfully</div>}
                                    {showError && <h6 className="error ">{error}</h6>}
                                </div>
                            </div>
                            <div className="qr-code-scanner"> <button type="button" onClick={verifyOtp}>Verify OTP &amp; Fetch Profile</button></div>
                        </div>
                    }
                    <div className="create-confirm-btns">
                        {props.setBack !== undefined && <button onClick={() => setBack(true)}>Back</button>}
                        {checkIfNotNull(selectedABHA) && !showOtpInput && <button onClick={() => requestOtpForSelectedAbha(false)}>Send OTP</button>}
                    </div>
                    {showError && <h6 className="error-msg">{error}</h6>}
                    {loader && <Spinner />}
                </div>}
            </div>}
        </div>
    );
}
export default VerifyHealthIdThroughMobileNumber;
