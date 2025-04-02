"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function p2pTransfer(to: string, amount: number) {
  const session = await getServerSession(authOptions);
  const fromUser = session?.user.id;

  if (!fromUser) {
    return {
      message: "Error while sending",
    };
  }

  const toUser = await prisma.user.findFirst({
    where: {
      number: to,
    },
  });

  if (!toUser) {
    return {
      message: "User not found",
    };
  }

  console.log(toUser);
  try {
    await prisma.$transaction(async (txn) => {
      await txn.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(fromUser)} FOR UPDATE`;

      const fromBalance = await txn.balance.findUnique({
        where: { userId: Number(fromUser) },
      });

      console.log(fromBalance);

      if (!fromBalance || fromBalance.amount < amount) {
        throw new Error("Insufficient funds");
      }

      await txn.balance.update({
        where: { userId: Number(fromUser) },
        data: { amount: { decrement: amount } },
      });

      console.log(fromUser);
      console.log(amount);

      await txn.balance.update({
        where: { userId: toUser.id },
        data: { amount: { increment: amount } },
      });

      console.log(toUser.id);
    });
  } catch (error) {
    console.log("Bhakkkkknjcwehkjcwehkckdnsckkm dsnak ");
  }
}
