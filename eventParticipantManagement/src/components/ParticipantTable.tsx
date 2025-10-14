import React, { useState } from "react";
import { Edit, Trash2, CheckCircle, X, Save, XCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import { deleteParticipant, updateParticipant } from "../store/slices/participantsSlice";

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  qr_code_url: string;
  attendance?: AttendanceRecord[];
}

interface AttendanceRecord {
  attendance_column_id: string;
  status: boolean;
  attendance_columns: {
    column_name: string;
  };
}

interface AttendanceColumn {
  id: string;
  column_name: string;
}

interface ParticipantTableProps {
  participants: Participant[];
  attendanceColumns: AttendanceColumn[];
}

const ParticipantTable: React.FC<ParticipantTableProps> = ({ participants, attendanceColumns }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  
  const handleDeleteParticipant = (participantId: string) => {
    const target = participants.find(p => p.id === participantId) || null;
    setParticipantToDelete(target);
    setShowDeleteModal(true);
  };

  const handleEditParticipant = (participant: Participant) => {
    setEditingParticipant(participant.id);
    setEditForm({
      name: participant.name,
      email: participant.email,
      phone: participant.phone
    });
  };

  const handleSaveEdit = (participantId: string) => {
    if (editForm.name.trim() && editForm.email.trim() && editForm.phone.trim()) {
      dispatch(updateParticipant({ 
        participantId, 
        updates: editForm 
      }));
      setEditingParticipant(null);
      setEditForm({ name: '', email: '', phone: '' });
    }
  };

  const handleCancelEdit = () => {
    setEditingParticipant(null);
    setEditForm({ name: '', email: '', phone: '' });
  };

  const getAttendanceStatus = (participant: Participant, columnId: string) => {
    if (!participant.attendance) return false;
    const record = participant.attendance.find(a => a.attendance_column_id === columnId);
    return record?.status || false;
  };
  return (
    <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              {attendanceColumns.map(column => (
                <th
                  key={column.id}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                >
                  {column.column_name}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map(participant => (
              <tr key={participant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {editingParticipant === participant.id ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    participant.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingParticipant === participant.id ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    participant.email
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingParticipant === participant.id ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    participant.phone
                  )}
                </td>
                {attendanceColumns.map(column => {
                  const isPresent = getAttendanceStatus(participant, column.id);
                  return (
                    <td
                      key={column.id}
                      className="px-6 py-4 whitespace-nowrap text-center"
                    >
                      {isPresent ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  );
                })}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {editingParticipant === participant.id ? (
                      <>
                        <button 
                          onClick={() => handleSaveEdit(participant.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Save changes"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                          title="Cancel editing"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEditParticipant(participant)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit participant"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteParticipant(participant.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete participant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Participant</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete
                {participantToDelete ? ` "${participantToDelete.name}"` : ''}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setParticipantToDelete(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (participantToDelete) {
                      dispatch(deleteParticipant(participantToDelete.id));
                    }
                    setShowDeleteModal(false);
                    setParticipantToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ParticipantTable;
