import React, { useState } from 'react';
import AddUserToProjectForm from '../projects/AddUserToProjectForm';

const AddUserButton = ({ projectId }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);

    const openForm = () => setIsFormOpen(true);
    const closeForm = () => setIsFormOpen(false);

    return (
        <>
            <button onClick={openForm}>Add User to Project</button>
            {isFormOpen && <AddUserToProjectForm projectId={projectId} onClose={closeForm} />}
        </>
    );
};

export default AddUserButton;