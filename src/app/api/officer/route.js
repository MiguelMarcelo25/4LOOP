import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Business from "@/models/Business";

export async function GET(request, { params }) {
  await connectMongoDB();

  const onlineRequest = await Business.find({}).populate('officerInCharge', 'fullName');
  if (!onlineRequest) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json(onlineRequest);
}

export async function POST(request) {
  await connectMongoDB()

  const {
    bidNumber = null,
    businessNickname = null,
    businessName = null,
    businessType = null,
    businessAddress = null,
    landmark = null,
    contactPerson = null,
    contactNumber = null,
    requestType = null,
    businessAccount = null,
    remarks = null,
    status = null,
  } = await request.json()

  let onlineRequest = {}

  if (bidNumber) { onlineRequest = { ...onlineRequest, bidNumber } }
  if (businessNickname) { onlineRequest = { ...onlineRequest, businessNickname } }
  if (businessName) { onlineRequest = { ...onlineRequest, businessName } }
  if (businessType) { onlineRequest = { ...onlineRequest, businessType } }
  if (businessAddress) { onlineRequest = { ...onlineRequest, businessAddress } }
  if (landmark) { onlineRequest = { ...onlineRequest, landmark } }
  if (contactPerson) { onlineRequest = { ...onlineRequest, contactPerson } }
  if (contactNumber) { onlineRequest = { ...onlineRequest, contactNumber } }
  if (onlineRequest) { onlineRequest = { ...onlineRequest, onlineRequest } }
  if (requestType) { onlineRequest = { ...onlineRequest, requestType } }
  if (businessAccount) { onlineRequest = { ...onlineRequest, businessAccount } }
  if (remarks) { onlineRequest = { ...onlineRequest, remarks } }
  if (status) { onlineRequest = { ...onlineRequest, status } }

  console.log("...")
  console.log(onlineRequest)
  const businessrequest = new Business(onlineRequest)
  await businessrequest.save();
  return NextResponse.json(businessrequest, { status: 200 })

}


