'use client';

import { useForm } from "react-hook-form";
import Modal from "../../../components/ui/Modal";
import { useEffect } from "react";

export interface AddPersonForm {

  name: string;

  mobile: string;

  gender: "Male" | "Female";

  society: string;

  house_no: string;

  areaId: string;

  notes?: string;

}

interface Props {
  open: boolean;
  onClose: () => void;

  onSave: (data: AddPersonForm) => void;

  areas: {
    id: string;
    name: string;
  }[];

  initialData?: AddPersonForm;
}

export default function AddPersonModal({

  open,
  onClose,
  onSave,
  areas,
  initialData

}: Props) {

  const {
  register,
  handleSubmit,
  reset,
  formState: { errors }
} = useForm<AddPersonForm>({
  defaultValues: initialData
});


useEffect(() => {

  if (initialData) {

    reset(initialData);

  }

}, [initialData, reset]);


  function submit(data: AddPersonForm) {

    onSave(data);

    reset();

    onClose();

  }

  return (

    <Modal
      open={open}
      onClose={()=>{
        reset();
        onClose();
      }}
      title="Add Person"
      maxWidth="max-w-lg"
    >

      <form
        onSubmit={handleSubmit(submit)}
        className="space-y-4"
      >

        <div>

          <label>Name</label>

          <input
            {...register("name",{required:true})}
            className="w-full border rounded-lg p-2"
          />

          {errors.name && (
            <p className="text-red-500 text-sm">
              Name required
            </p>
          )}

        </div>


        <div>

          <label>Mobile</label>

          <input
            {...register("mobile",{required:true})}
            className="w-full border rounded-lg p-2"
          />

        </div>


        <div>

          <label>Gender</label>

          <select
            {...register("gender")}
            className="w-full border rounded-lg p-2"
          >

            <option value="Male">
              Male
            </option>

            <option value="Female">
              Female
            </option>

          </select>

        </div>


        <div>

          <label>Society</label>

          <input
            {...register("society")}
            className="w-full border rounded-lg p-2"
          />

        </div>


        <div>

          <label>House Number</label>

          <input
            {...register("house_no")}
            className="w-full border rounded-lg p-2"
          />

        </div>


        <div>

          <label>Area</label>

          <select
            {...register("areaId")}
            className="w-full border rounded-lg p-2"
          >

            {areas.map(area=>(

              <option
                key={area.id}
                value={area.id}
              >

                {area.name}

              </option>

            ))}

          </select>

        </div>


        <div>

          <label>Notes</label>

          <textarea

            {...register("notes")}

            className="w-full border rounded-lg p-2"

          />

        </div>


        <button

          type="submit"

          className="w-full bg-blue-600 text-white rounded-lg py-2"

        >

          Save Person

        </button>

      </form>

    </Modal>

  );

}