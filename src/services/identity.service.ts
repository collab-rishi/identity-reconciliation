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
          c.linkPrecedence === 'primary' ? c.id : (c.linkedId as number)
        )
      ),
    ];

    const allRelated = await this.contactRepo.findByPrimaryIds(primaryIds);

    const truePrimary = [...allRelated].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    )[0];

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
    const emails = [
      ...new Set([primaryContact.email, ...allRelated.map((c) => c.email)]),
    ].filter(Boolean);

    const phoneNumbers = [
      ...new Set([
        primaryContact.phoneNumber,
        ...allRelated.map((c) => c.phoneNumber),
      ]),
    ].filter(Boolean);

    const secondaryContactIds = allRelated
      .filter((c) => c.linkPrecedence === 'secondary')
      .map((c) => c.id);

    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    };
  }
}
