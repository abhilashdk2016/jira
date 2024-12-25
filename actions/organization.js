"use server";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getOrganization(slug) {
    const { userId } = await auth();
    if(!userId) {
        throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    });

    if(!user) {
        throw new Error("User not found");
    }
    const client = await clerkClient();
    
    const organization = await client.organizations.getOrganization({
        slug,
      });

    if(!organization) {
        return null;
    }
    
    const { data : membership } = await client.organizations.getOrganizationMembershipList({
        organizationId: organization.id
    });

    const usermembership = membership.find(member => member.publicUserData.userId === userId);

    if(!usermembership) return null;

    return organization;
}

export async function getOrganizationUsers(orgId) {
    const { userId } = await auth();
    if(!userId) {
        throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    });

    if(!user) {
        throw new Error("User not found");
    }

    const client = await clerkClient();
    const { data : membership } = await client.organizations.getOrganizationMembershipList({
        organizationId: orgId
    });

    const userIds = membership.map(member => member.publicUserData.userId);

    const users = await db.user.findMany({
        where: {
            clerkUserId: {
                in: userIds,
            }
        }
    });

    return users;
}

export async function getUserIssues(userId) {
    const { orgId } = await auth();
  
    if (!userId || !orgId) {
      throw new Error("No user id or organization id found");
    }
  
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
  
    if (!user) {
      throw new Error("User not found");
    }
  
    const issues = await db.issue.findMany({
      where: {
        OR: [{ assigneeId: user.id }, { reporterId: user.id }],
        project: {
          organizationId: orgId,
        },
      },
      include: {
        project: true,
        assignee: true,
        reporter: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  
    return issues;
  }