import prisma from '../config/db';
import { LinkPrecedence } from '@prisma/client';

export class ContactRepository {
  async findMatches(email?: string, phoneNumber?: string) {
    return await prisma.contact.findMany({
      where: {
        OR: [{ email: email }, { phoneNumber: phoneNumber }],
      },
    });
  }

  async findByPrimaryIds(primaryIds: number[]) {
    return await prisma.contact.findMany({
      where: {
        OR: [{ id: { in: primaryIds } }, { linkedId: { in: primaryIds } }],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: {
    email?: string;
    phoneNumber?: string;
    linkedId?: number | null;
    linkPrecedence: LinkPrecedence;
  }) {
    return await prisma.contact.create({
      data: {
        email: data.email,
        phoneNumber: data.phoneNumber,
        linkedId: data.linkedId,
        linkPrecedence: data.linkPrecedence,
      },
    });
  }

  async convertToSecondary(idsToUpdate: number[], newPrimaryId: number) {
    await prisma.contact.updateMany({
      where: {
        id: { in: idsToUpdate },
      },
      data: {
        linkedId: newPrimaryId,
        linkPrecedence: 'secondary',
        updatedAt: new Date(),
      },
    });

    await prisma.contact.updateMany({
      where: {
        linkedId: { in: idsToUpdate },
      },
      data: {
        linkedId: newPrimaryId,
        updatedAt: new Date(),
      },
    });
  }
}
