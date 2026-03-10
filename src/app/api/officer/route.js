export const dynamic = "force-dynamic";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Business from "@/models/Business";
import { getSession } from "@/lib/Auth";

export async function GET(request, { params }) {
  await connectMongoDB();

  try {
    // Get the current user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    // Build filter based on user role
    let filter = {};
    if (role === "business") {
      // Business users can only see their own businesses
      filter = { businessAccount: userId };
    } else if (role === "officer" || role === "admin") {
      // Officers and admins can see all businesses
      filter = {};
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const onlineRequest = await Business.find(filter).populate('officerInCharge', 'fullName');
    
    if (!onlineRequest) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(onlineRequest);
  } catch (err) {
    console.error("❌ Error fetching businesses:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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



