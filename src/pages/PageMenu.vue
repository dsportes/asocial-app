<template>
<q-list class="titre-md" style="min-width: 200px">
  <q-item clickable @click="ui.setPage('compte')">
    <q-item-section>
      <q-item-label lines="1">{{$t('ACmesav')}}</q-item-label>
    </q-item-section>
  </q-item>
  <q-item clickable>
    <q-item-section clickable @click="ui.setPage('groupes')">
      <q-item-label lines="1">{{$t('ACmesgr')}}</q-item-label>
    </q-item-section>
  </q-item>
  <q-item clickable @click="ui.setPage('people')">
    <q-item-section>
      <q-item-label lines="1">{{$t('ACmesctc')}}</q-item-label>
    </q-item-section>
  </q-item>
  <q-item clickable  @click="maTribu()">
    <q-item-section>
      <q-item-label lines="1">{{$t('ACmatribu', [aSt.tribu.na.nom])}}</q-item-label>
    </q-item-section>
  </q-item>
  <q-item v-if="session.estComptable" clickable  @click="ui.setPage('tribus')">
    <q-item-section>
      <q-item-label lines="1">{{$t('ACtribus')}}</q-item-label>
    </q-item-section>
  </q-item>
  <q-item clickable>
    <q-item-section>
      <q-item-label lines="1">{{$t('ACmessecrets')}}</q-item-label>
    </q-item-section>
  </q-item>
  <q-separator color="orange"/>
  <q-item clickable @click="MD('detailsavatar')" clas="row items-center">
    <span class="text-italic text-bold" style="position:relative;top:3px">{{$t('ACav')}}</span>
    <q-btn class="q-ml-md text-bold" dense :label="aSt.avC.na.nomc" no-caps
      icon-right="open_in_new" @click="MD.oD('detailsavatar')"/>
  </q-item>
  <q-item clickable>
    <q-item-section class="q-ml-lg">
      <q-item-label lines="1">{{$t('ACsecrets')}}
        <q-badge color="primary" rounded>{{nbavsecs}}</q-badge>
      </q-item-label>
    </q-item-section>
  </q-item>
  <q-item clickable>
    <q-item-section class="q-ml-lg" clickable @click="ui.setPage('groupesac')">
      <q-item-label lines="1">{{$t('ACgroupes')}}
        <q-badge color="primary" rounded>{{nbgrps}}</q-badge>
      </q-item-label>
    </q-item-section>
  </q-item>
  <q-item clickable @click="ui.setPage('chats')">
    <q-item-section class="q-ml-lg">
      <q-item-label lines="1">{{$t('ACchats')}}
        <q-badge color="primary" rounded>{{nbchats}}</q-badge>
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
  <q-separator color="orange"/>
  <q-item v-if="session.groupeId" clickable @click="ui.setPage('groupe', 'groupe')">
    <span class="text-italic text-bold" style="position:relative;top:3px">{{$t('ACgr')}}</span>
    <q-btn class="q-ml-md text-bold" dense :label="gSt.egrC.groupe.na.nomc" no-caps
      icon-right="open_in_new" @click="ui.setPage('groupe', 'groupe')"/>
  </q-item>
  <q-item v-if="session.groupeId" clickable @click="ui.setPage('groupe', 'membres')">
    <q-item-section class="q-ml-lg">
      <q-item-label lines="1">{{$t('ACsecrets')}}
        <q-badge color="primary" rounded>{{nbtgrsec}}</q-badge>
      </q-item-label>
    </q-item-section>
  </q-item>
  <q-separator color="orange"/>
  <q-item v-if="!session.incognito" clickable>
    <q-item-section>
      <q-item-label lines="1">{{$t('ACficav')}}</q-item-label>
    </q-item-section>
  </q-item>
  <q-item v-if="!session.incognito" clickable>
    <q-item-section>
      <q-item-label lines="1">{{$t('ACtfloc')}}</q-item-label>
    </q-item-section>
  </q-item>
</q-list>
</template>

<script>
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'PageMenu',

  computed: {
    nbavsecs () { return this.aSt.eavC.secrets.size },
    nbchats () { return this.aSt.eavC.chats.size },
    nbspons () { return this.aSt.eavC.sponsorings.size },
    nbgrps () { return this.aSt.eavC.avatar.lgr.size },

    nbgrsecs () { return '?' },
    nbmbs () { return '?' },

    nbtav () { return this.aSt.compta.mav.size },
    nbtgr () { return this.gSt.map.size },
    nbtgrsec () { return this.gSt.egrC.secrets.size },
    nbtct () { return this.pSt.map.size },
    nbttr () { return this.aSt.nbTribus },
    nbtsp () { return 1 },
    nbtiv () { return 1 },
  },

  methods: {
    maTribu () { 
      this.aSt.setTribuC()
      this.ui.setPage('tribu')
    },
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      MD,
      aSt: stores.avatar,
      ui: stores.ui,
      session: stores.session,
      gSt: stores.groupe
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-item
  min-height: 20px !important
  padding: 3px 1rem !important
</style>
