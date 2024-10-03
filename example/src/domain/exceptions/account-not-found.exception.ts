import { DomainError } from '@ocoda/event-sourcing';
import type { AccountId } from '../models';

export class AccountNotFoundException extends DomainError {
	static withId(id: AccountId): AccountNotFoundException {
		return new AccountNotFoundException('Account not found', id);
	}
}