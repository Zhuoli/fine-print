import type {StructureResolver} from 'sanity/structure'

const TOPICS = ['deadline', 'eligibility', 'aiPolicy', 'originality', 'submission', 'team', 'prize', 'judging', 'payout', 'sponsor', 'cost']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Fine Print')
    .items([
      // The review queue comes first: conflicts nobody has decided yet.
      S.listItem().title('⚠️ Open conflicts').child(
        S.documentList().title('Open conflicts').filter('_type == "conflict" && status == "open"').apiVersion('2026-09-24'),
      ),
      S.documentTypeListItem('conflict').title('All conflicts'),
      S.divider(),
      S.documentTypeListItem('contest').title('Contests'),
      S.listItem().title('Clauses by topic').child(
        S.list().title('Topics').items(TOPICS.map((t) =>
          S.listItem().id(t).title(t).child(
            S.documentList().title(t).filter('_type == "clause" && topic == $t').params({t}).apiVersion('2026-09-24'),
          ))),
      ),
      S.documentTypeListItem('clause').title('All clauses'),
      S.documentTypeListItem('ruleSource').title('Rule sources (by precedence)'),
      S.divider(),
      S.documentTypeListItem('organizer').title('Organizers'),
      S.documentTypeListItem('entrantProfile').title('Demo entrant profiles'),
    ])
