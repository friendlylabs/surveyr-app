function showForm(data) {
    window.location.href = `/pages/forms/show.html?id=${data.formId}`;
}

async function removeForm(data) {

    const formId = data.formId;
    const form = document.getElementById(`form-${formId}`);

    // confirm delete, sweetalert
    Swal.fire({
        title: 'Delete Form',
        text: 'This action cannot be undone, and all submissions will be lost!',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        confirmButtonColor: '#f27474',
    }).then((result) => {
        (async () => {
            if (result.isConfirmed) {
                console.log("Deleting form:", formId);
                try {
                    var deleteStatus = await deleteForm(formId);
                    if(!deleteStatus) {
                        toast.error({ message: 'Error deleting form!' });
                        return;
                    }

                    form.remove();
                    clearSubmissionsByFormId(formId);
                    toast.success({ message: 'Form deleted successfully!' });
                }

                catch (error) {
                    console.error("Error deleting form:", error);
                    toast.error({ message: 'Error deleting form!' });
                }
            }
        })();
    });
}

async function syncForm(data) {
    const icon = document.getElementById(`icon-${data.formId}`);
    const syncButton = document.getElementById('syncFormBtn');
    const submissionToken = localStorage.getItem("token");
    const submissionUrl = `${localStorage.getItem("projectUrl")}collection/store/multiple`;

    // Update icon state
    const setIconState = (state) => {
        icon.classList.remove('fa-files', 'fa-spinner', 'fa-spin');
        if (state === 'loading') icon.classList.add('fa-spinner', 'fa-spin');
        else icon.classList.add('fa-files');
    };

    setIconState('loading');

    // Check for internet connection
    if (!navigator.onLine) {
        toast.error({ message: 'No internet connection' });
        setIconState();
        return;
    }

    try {
        const submissions = await getSubmissionsByFormId(data.formId);
        if (!submissions.length) {
            toast.error({ message: "No submissions to sync!" });
            setIconState();
            return;
        }

        const formData = new FormData();
        formData.append("formId", data.formId);
        let submissionList = [];
        submissions.forEach((submission) => {
            submissionList.push(submission.content);
        });

        formData.append("content", JSON.stringify(submissionList));
        const response = await fetch(submissionUrl, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${submissionToken}`
            },
            body: formData
        });
        
        const result = await response.json();
        if (response.ok && result.status) {
            toast.success({ message: "Form synced successfully!" });
            clearSubmissionsByFormId(data.formId);
        } else {
            toast.error({ message: result.message || "Error syncing form!" });
        }
    } catch (error) {
        console.error("Error syncing form:", error);
        toast.error({ message: "Unable to sync form, please try again!" });
        syncButton.disabled = true;
    } finally {
        setIconState();
    }
}
