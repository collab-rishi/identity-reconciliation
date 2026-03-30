import { ContactRepository } from '../repositories/contact.repository';
import { Contact } from '@prisma/client';
export class IdentityService {
  private contactRepo: ContactRepository;

  constructor() {
    this.contactRepo = new ContactRepository();
  }

  async processIdentification(email?: string, phoneNumber?: string) {
    const existingContacts = await this.contactRepo.findMatches(
      email,
      phoneNumber
    );

    if (existingContacts.length === 0) {
      const newContact = await this.contactRepo.create({
        email,
        phoneNumber,
        linkPrecedence: 'primary',
        linkedId: null,
      });
      return this.formatResponse(newContact, [newContact]);
    }

    const primaryIds = [
      ...new Set(
        existingContacts.map((c) =>
          c.linkPrecedence === 'primary' ? c.id : c.linkedId!
        )
      ),
    ];

    let allRelated = await this.contactRepo.findByPrimaryIds(primaryIds);

    const truePrimary = allRelated
      .filter((c) => c.linkPrecedence === 'primary') // Only a primary can be the "True Primary"
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

    const otherPrimaryIds = primaryIds.filter((id) => id !== truePrimary.id);

    if (otherPrimaryIds.length > 0) {
      await this.contactRepo.convertToSecondary(
        otherPrimaryIds,
        truePrimary.id
      );

      allRelated = await this.contactRepo.findByPrimaryIds([truePrimary.id]);
    }

    const isNewEmail = email && !allRelated.some((c) => c.email === email);
    const isNewPhone =
      phoneNumber && !allRelated.some((c) => c.phoneNumber === phoneNumber);

    if (isNewEmail || isNewPhone) {
      const newSecondary = await this.contactRepo.create({
        email,
        phoneNumber,
        linkedId: truePrimary.id,
        linkPrecedence: 'secondary',
      });
      allRelated.push(newSecondary);
    }

    return this.formatResponse(truePrimary, allRelated);
  }

  private formatResponse(primaryContact: Contact, allRelated: Contact[]) {
    const secondaryContactIds = allRelated
      .filter((c) => c.id !== primaryContact.id)
      .map((c) => c.id);

    const emails = [
      primaryContact.email,
      ...allRelated
        .map((c) => c.email)
        .filter((e) => e !== primaryContact.email),
    ].filter((e): e is string => Boolean(e));

    const phoneNumbers = [
      primaryContact.phoneNumber,
      ...allRelated
        .map((c) => c.phoneNumber)
        .filter((p) => p !== primaryContact.phoneNumber),
    ].filter((p): p is string => Boolean(p));

    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails: [...new Set(emails)],
        phoneNumbers: [...new Set(phoneNumbers)],
        secondaryContactIds: [...new Set(secondaryContactIds)],
      },
    };
  }
}
