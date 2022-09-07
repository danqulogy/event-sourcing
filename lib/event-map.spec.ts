import { EventName } from './decorators';
import { EventMap } from './event-map';
import { MissingEventMetadataException, UnregisteredEventException } from './exceptions';
import { DefaultEventSerializer } from "./helpers";
import { IEvent, IEventPayload, IEventSerializer } from './interfaces';

describe(EventMap, () => {
	let now = new Date();

	@EventName('account-opened')
	class AccountOpenedEvent implements IEvent {
		constructor(public readonly opened: Date) {}
	}

	class UnregisteredEvent implements IEvent {}

	beforeAll(() => jest.useFakeTimers({ now }));

	afterAll(() => jest.useRealTimers());

	it('throws when registering an event without an event-name', () => {
		class FooCreatedEvent implements IEvent {}

		const eventMap = new EventMap();

		expect(() => eventMap.register(FooCreatedEvent)).toThrowError(MissingEventMetadataException);
	});

	it('returns if an event-map has a certain event', () => {
		const eventMap = new EventMap();
		eventMap.register(AccountOpenedEvent);

		expect(eventMap.has('account-opened')).toBe(true);
		expect(eventMap.has(AccountOpenedEvent)).toBe(true);
		expect(eventMap.has(new AccountOpenedEvent(new Date()))).toBe(true);

		expect(eventMap.has('unregistered-event')).toBe(false);
		expect(eventMap.has(UnregisteredEvent)).toBe(false);
	});

	it('returns the constructor of a registered event by its name or an instance', () => {
		const eventMap = new EventMap();
		eventMap.register(AccountOpenedEvent);

		expect(eventMap.getConstructor('account-opened')).toBe(AccountOpenedEvent);
		expect(eventMap.getConstructor(new AccountOpenedEvent(new Date()))).toBe(AccountOpenedEvent);
	});

	it('throws when trying to get the constructor of an unregistered event by its name or an instance', () => {
		const eventMap = new EventMap();

		expect(() => eventMap.getConstructor('unregistered-event')).toThrowError(
			new UnregisteredEventException('unregistered-event'),
		);
		expect(() => eventMap.getConstructor(new UnregisteredEvent())).toThrowError(
			new UnregisteredEventException('UnregisteredEvent'),
		);
	});

	it('returns the name of a registered event by its constructor or an instance', () => {
		const eventMap = new EventMap();
		eventMap.register(AccountOpenedEvent);

		expect(eventMap.getName(AccountOpenedEvent)).toBe('account-opened');
		expect(eventMap.getName(new AccountOpenedEvent(new Date()))).toBe('account-opened');
	});

	it('throws when trying to get the name of an unregistered event by its constructor or an instance', () => {
		const eventMap = new EventMap();

		expect(() => eventMap.getName(UnregisteredEvent)).toThrowError(new UnregisteredEventException(UnregisteredEvent));
		expect(() => eventMap.getName(new UnregisteredEvent())).toThrowError(new UnregisteredEventException(new UnregisteredEvent()));
	});

	it('returns the serializer of a registered event by its name, constructor or an instance', () => {
		const customEventSerializer: IEventSerializer<AccountOpenedEvent> = {
			serialize: ({ opened }: AccountOpenedEvent) => ({
				opened: opened.toISOString(),
			}),
			deserialize: ({ opened }: { opened: string }) => new AccountOpenedEvent(new Date(opened)),
		};

		const eventMap = new EventMap();
		eventMap.register(AccountOpenedEvent, customEventSerializer);

		expect(eventMap.getSerializer('account-opened')).toBe(customEventSerializer);
		expect(eventMap.getSerializer(AccountOpenedEvent)).toBe(customEventSerializer);
		expect(eventMap.getSerializer(new AccountOpenedEvent(new Date()))).toBe(customEventSerializer);
	});

	it('serializes a registered event', () => {
		const eventMap = new EventMap();
		eventMap.register(AccountOpenedEvent, DefaultEventSerializer.for(AccountOpenedEvent));

		const event = new AccountOpenedEvent(new Date());
		const payload = eventMap.serializeEvent<AccountOpenedEvent>(event)

		expect(payload).toBeInstanceOf(Object)
		expect(payload).toEqual(event)
	})

	it('deserializes a registered event', () => {
		const eventMap = new EventMap();
		eventMap.register(AccountOpenedEvent, DefaultEventSerializer.for(AccountOpenedEvent));

		const payload = { opened: new Date() };
		const event = eventMap.deserializeEvent<AccountOpenedEvent>('account-opened', payload);

		expect(event).toBeInstanceOf(AccountOpenedEvent)
		expect(event).toEqual(event)
	})
});
