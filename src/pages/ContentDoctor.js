import React, { useState, useEffect } from 'react';
import '../styles/generalComponentWrapper.css'
import { Checkbox } from "@material-tailwind/react";
import _ from 'lodash';
import ReactImageZoom from 'react-image-zoom';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom'
import url from '../config'

const ContentDoctor = () => {
    const navigate=useNavigate();
    const params = useParams();
    const designation = params.designation;
    
    const [imgUrl, setImgUrl] = React.useState(null);
    const [images, setImages] = React.useState(null);
    const [differ, setDiffer] = React.useState(null);
    const [differSelected, setDifferSelected] = React.useState(false);
    const [imgSrc, setImgSrc] = React.useState(null);
    const [doctorTitle, setDoctorTitle] = React.useState(["Doctor A", "Doctor B", "Doctor C"]);
    const [selectedDoctor, setSelectedDoctor] = React.useState(null);
    const [submittedFiles, setSubmittedFiles] = useState([]);
    const [currFile, setCurrFile] = useState(null);
    const [display, setDisplay] = useState("hidden");
    const [img, setImg] = useState(null);
    const [doctorSuggestion, setDoctorSuggestion] = React.useState({
        "Doctor A": "",
        "Doctor B": "",
        "Doctor C": ""
    })
    const props = { width: 400, height: 300, zoomWidth: 300, img: imgSrc, offset: { horizontal: 50 } };

    const [doctorDiseasePrescription, setDoctorDiseasePrescription] = React.useState({
        'Unclear Image': false,
        'Normal Image': false,
        'Mild': false,
        'Moderate': false,
        'Severe': false,
        'Proliferative': false,
    });

    async function getPrescription(image_name, doctor) {

        const response = await axios(
            {
                method: 'get',
                url: `${url}/data/getPrescription`,
                headers: { 'Content-Type': 'application/json' },
                params: {
                    image_name: image_name,
                    doctor: doctor
                }
            }
        )

        return response.data.prediction;
    }

    async function getSuggestion(image_name) {

        const response = await axios(
            {
                method: 'get',
                url: `${url}/data/getSuggestion`,
                headers: { 'Content-Type': 'application/json' },
                params: {
                    image_name: image_name,
                }
            }
        )

        return response;
    }

    async function addPrescription(image_name, doctor, prediction, suggestion) {
        var bodyData;
        bodyData = JSON.stringify({ image_name, doctor, prediction, suggestion })

        const response = await fetch(`${url}/data/addPrescription`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: bodyData
        });

        return response;
    }

    async function getImages(folder, setFunc = 0) {
        const response = await axios(
            {
                method: 'get',
                url: `${url}/image/getImages/${folder}`,
            }
        )
        if (setFunc !== 0) {
            setFunc(response.data);
        }
        return response.data;
    }

    async function moveImage(oldFolder, newFolder) {

        var bodyData;
        bodyData = JSON.stringify({ currFile, oldFolder, newFolder })

        const response = await fetch(`${url}/image/moveImage`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: bodyData
        });

        const res = await response.json();
        if (res.type === "success") {
            if (designation === "A") {
                getImages("PartialReviewed", setSubmittedFiles);
                getImages("nonReviewed", setImages);
                getImages("Differ", setDiffer);
            }
            else if (designation === "B") {
                getImages("PartialReviewed", setImages);
                getImages("Reviewed", setSubmittedFiles)
            }
            else if (designation === "C") {
                getImages("Reviewed", setImages);
                getImages("Finalized", setSubmittedFiles)
            }
        }
    }

    useEffect(() => {
        setSelectedDoctor(`Doctor ${designation}`)
        if (designation === "A" && images === null) {
            getImages("nonReviewed", setImages);
            setImgUrl("nonReviewed");
            getImages("Differ", setDiffer);
            getImages("PartialReviewed", setSubmittedFiles)
        }
        else if (designation === "B" && images === null) {
            getImages("PartialReviewed", setImages);
            setImgUrl("partial");
            getImages("Reviewed", setSubmittedFiles);
        }
        else if (designation === "C" && images === null) {
            getImages("Reviewed", setImages);
            setImgUrl("review");
            getImages("Finalized", setSubmittedFiles);
        }
    }, [designation, images])



    function handleChange(event) {
        setDoctorDiseasePrescription(
            {
                ...doctorDiseasePrescription,
                [event.target.name]: event.target.checked
            }
        )
    }

    async function handleCompleteion() {
        // download a file of json with doctor prescription information
        let DoctorA = await getPrescription(currFile, 'Doctor A');
        let DoctorB = await getPrescription(currFile, 'Doctor B');
        let DoctorC = await getPrescription(currFile, 'Doctor C');
        let obj = { DoctorA, DoctorB, DoctorC }
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(obj)], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "doctorDiseasePrescription.json";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        alert("All doctors have same prescription which has been downloaded");

    }

    function resetToInitialState() {
        // reset all the state to initial state
        setDoctorDiseasePrescription({
            'Unclear Image': false,
            'Normal Image': false,
            'Mild': false,
            'Moderate': false,
            'Severe': false,
            'Proliferative': false,
        })

        // reset the image to null
        setImgSrc(null);

        setDoctorSuggestion({
            "Doctor A": "",
            "Doctor B": "",
            "Doctor C": ""
        })

    }

    async function proceedToNextDoctor() {
        const currentIndex = doctorTitle.indexOf(selectedDoctor);

        if (designation !== "A") {
            let currentPrescription = doctorDiseasePrescription;

            let previousPrescription = await getPrescription(currFile, doctorTitle[currentIndex - 1]);
            let addedPrescription = await addPrescription(currFile, selectedDoctor, doctorDiseasePrescription, doctorSuggestion[selectedDoctor])
            let status = _.isEqual(currentPrescription, previousPrescription);
            console.log(status);
            console.log(currentPrescription, previousPrescription)
            if (addedPrescription.status === 200) {
                setDoctorSuggestion({
                    "Doctor A": "",
                    "Doctor B": "",
                    "Doctor C": ""
                })
                if (status) {
                    if (designation === "B") {
                        moveImage("PartialReviewed", "Reviewed");
                        alert("Prescription added successfully");
                        resetToInitialState();
                    }
                    else {
                        moveImage("Reviewed", "Finalized");
                        resetToInitialState();
                        alert("Prescription added successfully");
                        handleCompleteion();
                    }

                } else {
                    alert("Prescription is not same as previous doctor");
                    if (designation === "B") {
                        moveImage("PartialReviewed", "Differ");
                        resetToInitialState();
                    }
                    else {
                        moveImage("Reviewed", "PartialReviewed");
                        resetToInitialState();
                    }
                }
            }
            else {
                alert("There was some error while handling your request");

            }

        } else {
            if (imgSrc === null) {
                alert("Please select image first");
            }
            else {
                let addedPrescription = await addPrescription(currFile, selectedDoctor, doctorDiseasePrescription, doctorSuggestion[selectedDoctor]);
                let oldFolder = differSelected ? "Differ" : "nonReviewed";
                if (addedPrescription.status === 200) {
                    setDoctorSuggestion({
                        "Doctor A": "",
                        "Doctor B": "",
                        "Doctor C": ""
                    })
                    let currentPrescription = doctorDiseasePrescription;
                    let nextPrescription = await getPrescription(currFile, doctorTitle[currentIndex + 1]);
                    if (nextPrescription !== null) {
                        let status = _.isEqual(currentPrescription, nextPrescription);
                        if (status) {
                            //move to reviewed
                            moveImage(oldFolder, "Reviewed");
                            alert("Prescription added successfully");
                            resetToInitialState();
                        }
                        else {
                            //move to partial reviewed
                            moveImage(oldFolder, "PartialReviewed");
                            alert("Prescription added successfully");
                            resetToInitialState();
                        }
                    }
                    else {
                        //move to partial reviewed
                        moveImage(oldFolder, "PartialReviewed");
                        alert("Prescription added successfully");
                        resetToInitialState();
                    }
                }
                else {
                    alert("There was some error while handling your request");
                }


            }
        }


    }

    async function preview_image() {
        var suggestion = differSelected ? await getSuggestion(differ[img]) : await getSuggestion(images[img]);
        // console.log(suggestion)
        if (!suggestion.data.type) {
            setDoctorSuggestion((prev) => { return { ...prev, ...suggestion.data } })
        }
        // differSelected ? setImgSrc(`${url}/images/differ/${differ[img]}`) : setImgSrc(`${url}/images/${imgUrl}/${images[img]}`)
        differSelected ?
        setImgSrc(`${url}/image/${differ[img]}`)
        :
        setImgSrc(`${url}/image/${images[img]}`)

        setCurrFile(differSelected ? differ[img] : images[img])
    }

    let login = localStorage.getItem("login");
    if(login)
    {
        return (
            <div className="container">

            {/* <!-- Modal --> */}
            <div className={`modal bg-white z-10 fade fixed top-0 my-3 left-[30%] w-[50%] h-[96%] border-2 border-black overflow-x-hidden overflow-y-auto ${display}`}
                id="exampleModalScrollable" tabIndex="-1" aria-labelledby="exampleModalScrollableLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-scrollable relative w-auto pointer-events-none">
                    <div
                        className="modal-content border-none shadow-lg relative flex flex-col w-full h-full pointer-events-auto bg-white bg-clip-padding rounded-md outline-none text-current">
                        <div
                            className="modal-header flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
                            <h5 className="text-xl font-medium leading-normal text-gray-800" id="exampleModalScrollableLabel">
                                Choose Image
                            </h5>
                            <div
                                className="modal-footer flex flex-shrink-0 flex-wrap items-center justify-end">
                                <button type="button"
                                    className="inline-block px-6 py-2.5 bg-purple-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-purple-700 hover:shadow-lg focus:bg-purple-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-purple-800 active:shadow-lg transition duration-150 ease-in-out"
                                    data-bs-dismiss="modal" onClick={() => { setDisplay("hidden") }}>
                                    Cancel
                                </button>
                                <button type="button"
                                    className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out ml-1" onClick={() => { setDisplay("hidden"); preview_image(); }}>
                                    Select
                                </button>
                            </div>
                        </div>
                        <div className='min-h-[520px]'>
                            <div className="modal-body relative p-4 grid grid-cols-4 gap-4">
                                {differSelected ?
                                    differ && differ?.map((image, index) => <button key={index} className='focus:border-black border-2' onClick={() => { setImg(index) }}><img className='h-[90%] w-full' key={index} 
                                    src={`${url}/image/${image}`}
                                    // src = {`https://www.googleapis.com/drive/v3/files/${image}?alt=media&key=AIzaSyAgiFBJIw_rzYvQ7-mn4xfBKILNKEautRk`}
                                     alt="" /></button>)
                                    : images && images?.map((image, index) => <button key={index} className='focus:border-black border-2' onClick={() => { setImg(index) }}><img className='h-[90%] w-full' key={index} 
                                    src={`${url}/image/${image}`}
                                    // src = {`https://www.googleapis.com/drive/v3/files/${image}?alt=media&key=AIzaSyAgiFBJIw_rzYvQ7-mn4xfBKILNKEautRk`}
                                    alt="" /></button>)
                                }

                            </div>
                        </div>


                    </div>
                </div>
            </div>
            {/* aside */}
            <div className="aside text-center">
                <h1 className="text-3xl text-center font-normal leading-normal mt-0 mb-2 text-black-800">Diabetic Retinopathy</h1>
                <h4 className="text-3xl text-center font-normal leading-normal mt-0 mb-2 text-pink-800">
                    Doctor {designation}
                </h4>
                <textarea className='m-3 border-2 border-gray-900' value={doctorSuggestion[selectedDoctor]} onChange={(e) => setDoctorSuggestion((prev) => { return { ...prev, [selectedDoctor]: e.target.value } })}></textarea>
                {/* <p>NAME: <br /> DESIGNATION: <br /> </p> */}
                <div className="chbx flex flex-col">
                    <p className="text-1xl text-center font-normal leading-normal mt-0 mb-2 text-pink-800">
                        DISEASE OBSERVED
                    </p>
                    {/* start checkbox with new line */}
                    {(selectedDoctor !== null && doctorDiseasePrescription !== undefined) && <div className='w-max flex flex-col items-baseline mx-auto'><div className="chbx mt-3">
                        <Checkbox color="blue" name="Unclear Image" label='Unclear Image' checked={doctorDiseasePrescription['Unclear Image']} onChange={handleChange} />
                    </div>
                        <div className="chbx mt-3">
                            <Checkbox color="blue" name='Normal Image' label='Normal Image' checked={doctorDiseasePrescription['Normal Image']} onChange={handleChange} />
                        </div>
                        <div className="chbx mt-3">
                            <Checkbox color="blue" name="Mild" label='Mild' checked={doctorDiseasePrescription['Mild']} onChange={handleChange} />
                        </div>
                        <div className="chbx mt-3">
                            <Checkbox color="blue" name="Moderate" label='Moderate' checked={doctorDiseasePrescription['Moderate']} onChange={handleChange} />
                        </div>
                        <div className="chbx mt-3">
                            <Checkbox color="blue" name="Severe" label='Severe' checked={doctorDiseasePrescription['Severe']} onChange={handleChange} />
                        </div>
                        <div className="chbx mt-3">
                            <Checkbox color="blue" name="Proliferative" label='Proliferative' checked={doctorDiseasePrescription['Proliferative']} onChange={handleChange} />
                        </div>
                        </div>
                        }
                    <br />
                    <button onClick={proceedToNextDoctor} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Submit Disease
                    </button>
                </div>
            </div>
            {/* ----right---- */}
            <div className="main-content">
                <div className="section">
                    <div className='float-right mx-3'>
                        <button className="inline-block px-6 py-2.5 bg-purple-600 m-3 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-purple-700 hover:shadow-lg" onClick={()=>{localStorage.removeItem("login"); navigate('/login')}}>Logout</button>
                    </div>
                    <div className='filesContent'>
                        <b>Submitted Files</b>
                        <ul>
                            {submittedFiles?.map(f => <li>{f}</li>)}
                        </ul>
                    </div>

                    <dir>
                        <h2>SELECT PICTURE TO EXAMINE</h2>
                        <button className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg" onClick={() => { setDifferSelected(false); setDisplay('') }}>Select Picture</button>
                        <button className={`inline-block px-6 py-2.5 bg-purple-600 m-3 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-purple-700 hover:shadow-lg ${designation === "A" ? "" : "hidden"}`} onClick={() => { setDifferSelected(true); setDisplay('') }}>Select Differ Pictures</button>
                    </dir>

                    <br />
                    <br />
                    <div id="wrapper">
                        {
                            imgSrc && 
                            <div>
                               
                                <ReactImageZoom {...props} />
                            </div>

                        }
                    </div>

                    <div>
                        {Object.entries(doctorSuggestion).map(sugg => {
                            if (sugg[1] === "" || sugg[0] === selectedDoctor || sugg[1] === null) return null;
                            return <p><b>{sugg[0]}: </b>{sugg[1]}</p>
                        })}
                        {console.log(doctorSuggestion)}
                    </div>

                </div>

            </div>
        </div>
        )
    }
    else
    {
        return(
        <div className='flex text-center h-screen'>
            <h1 className='m-auto text-2xl font-extrabold'>Please login first to proceed</h1>
        </div>

        ) 
    }
}

export default ContentDoctor