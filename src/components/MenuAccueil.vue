<template>
<q-list v-if="session.status === 2" class="titre-md" style="min-width: 360px">
  <div v-if="bloc && !session.estComptable" 
    class="q-px-sm titre-md msg cursor-pointer"
    @click="clickNotif2">{{$t('ACbloc')}}
  </div>

  <div v-if="!bloc">
    <q-item class="q-my-md" clickable @click="ui.setPage('notes')">
      <q-item-section>
        <q-item-label 
          class="h1 titre-lg q-pa-xs bg-yellow-3 text-black text-bold text-center" 
          lines="1">{{$t('ACmesnotes')}}</q-item-label>
      </q-item-section>
    </q-item>
  </div>

  <q-item v-if="session.estComptable" clickable  @click="ui.setPage('espace')">
    <q-item-section>
      <q-item-label lines="1">{{$t('ACpartitions')}}</q-item-label>
    </q-item-section>
  </q-item>

  <q-item v-if="!session.estComptable && session.estDelegue && !session.estA && session.accesNet" 
    clickable  @click="maPartition()">
    <q-item-section>
      <q-item-label lines="1">{{$t('ACgpart')}}</q-item-label>
    </q-item-section>
  </q-item>

  <q-item clickable  @click="infoSession()">
    <q-item-section>
      <q-item-label lines="1">{{$t('MLAinfm')}}
        <icon-mode />
      </q-item-label>
    </q-item-section>
  </q-item>

  <div v-if="!bloc" class="q-mt-md">

    <q-item clickable @click="ui.setPage('compte')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACmesav' + (session.estDelegue ? '1' : '2'))}}</q-item-label>
      </q-item-section>
    </q-item>

    <q-item clickable>
      <q-item-section clickable @click="ui.setPage('groupes')">
        <q-item-label class="row q-gutter-sm">
          <span>{{$t('ACmesgr', nbparts, {count: nbparts})}}</span>
          <span v-if="nbgrpsT">{{$t('ACmesgra')}}
            <q-badge color="primary" rounded>{{nbgrpsT}}</q-badge>
          </span>
          <span v-if="nbInvits">{{$t('ACmesgri')}}
            <q-badge :color="nbInvits ? 'warning' : 'primary'" rounded>{{nbInvits}}</q-badge>
          </span>
          <span v-if="nbContacts">{{$t('ACmesgrc')}}
            <q-badge color="primary" rounded>{{nbContacts}}</q-badge>
          </span>
          <span v-if="nbparts">)</span>
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item clickable @click="ui.setPage('people')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACmesctc')}}</q-item-label>
      </q-item-section>
    </q-item>

    <q-item clickable @click="tousChats">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACchats')}}
          <q-badge color="primary" rounded>{{nbchats}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item v-if="!session.incognito" clickable @click="ficAvion2">
      <q-item-section>
        <q-item-label lines="1">{{$t('MLAfav')}}
          <q-badge color="primary" rounded>{{nbficav}}</q-badge>
          <queue-icon/>
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-separator color="orange"/>

    <q-item class="row items-center">
      <sel-avid/>
    </q-item>

    <q-item clickable>
      <q-item-section class="q-ml-lg" clickable @click="ui.setPage('groupesac')">
        <q-item-label lines="1">{{$t('ACgroupes')}}
          <q-badge color="primary" rounded>{{nbgrps}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item clickable class="q-ml-lg" @click="chatsAv">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACchats')}}
          <q-badge color="primary" rounded>{{nbchatsAv}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item clickable class="q-ml-lg" @click="ui.setPage('sponsorings')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACsponsorings')}}
          <q-badge color="primary" rounded>{{nbspons}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-separator v-if="session.groupeId" class="q-my-xs" color="orange"/>

    <q-item class="row items-center">
      <sel-grid/>
    </q-item>

    <q-item v-if="session.groupeId" clickable class="q-ml-lg" @click="ui.setPage('groupe', 'groupe')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACgr')}}</q-item-label>
      </q-item-section>
    </q-item>

    <q-item v-if="session.groupeId" clickable class="q-ml-lg" @click="ui.setPage('groupe', 'membres')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACmb')}}
          <q-badge color="primary" rounded>{{nbMembres}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>

  </div>

</q-list>
</template>

<script setup>
import { computed } from 'vue'

import stores from '../stores/stores.mjs'
import SelAvid from './SelAvid.vue'
import SelGrid from './SelGrid.vue'
import { GetPartition } from '../app/operations4.mjs'
import QueueIcon from './QueueIcon.vue'
import IconMode from './IconMode.vue'

const props = defineProps({ 
  menu: Boolean 
})

const aSt = stores.avatar
const gSt = stores.groupe
const faSt = stores.ficav
const session = stores.session
const ui = stores.ui
const fSt = stores.filtre

const nbchats = computed(() => aSt.nbchats )
const nbchatsAv = computed(() => { const x = aSt.eavC; return x ? x.chats.size : 0 })
const nbspons = computed(() => { const x = aSt.eavC; return x ? x.sponsorings.size : 0 })
const nbgrps = computed(() => session.compte.idGroupes(session.avatarId).size )
const nbgrpsT = computed(() => session.compte.idGroupes().size )
const nbInvits = computed(() => gSt.invitsAtt.length )
const nbContacts = computed(() => gSt.contactsAtt.length )
const nbparts = computed(() => nbgrpsT.value + nbInvits.value || nbContacts.value )
const nbMembres = computed(() => gSt.nbMbC )
const bloc = computed(() => session.mini )
const nomg = computed(() => { const idg = session.groupeid; return idg ? session.getCV(idg).nom : '' })
const nbficav = computed(() => faSt.map.size )

function clickNotif2 () {ui.setPage('compta', 'chats')}

function ficAvion2 () { ui.setPage('ficavion')}

function infoSession () { if (session.status === 2) ui.setPage('session') }

async function maPartition () { 
  await new GetPartition().run(session.compte.idp)
  ui.setPage('partition')
}

function chatsAv () {
  fSt.filtre.chats.tous = false
  ui.setPage('chats')
}

function tousChats () {
  fSt.filtre.chats.tous = true
  ui.setPage('chats')
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-item
  min-height: 20px !important
  padding: 3px 1rem !important
.h1:hover
  font-style: italic !important
  background-color: white !important
</style>
