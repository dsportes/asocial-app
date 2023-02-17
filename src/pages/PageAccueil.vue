<template>
  <q-page>
    <div class="q-pa-sm">
      <div class="q-my-xs titre-md text-bold text-italic">{{$t('ACav', [session.avC.na.nomc])}}</div>
      <div class="row items-center q-gutter-sm">
        <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACaproposav')" />
        <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACsecrets')">
          <q-badge color="teal-10" rounded floating>{{nbavsecs}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACgroupes')">
          <q-badge color="teal-10" rounded floating>{{nbgrps}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACsponsorings')"
          @click="ui.setPage('sponsorings')">
          <q-badge color="teal-10" rounded floating>{{nbspons}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACinvitations')">
          <q-badge color="teal-10" rounded floating>{{nbinvits}}</q-badge>
        </q-btn>
      </div>
    </div>
    <q-separator class="q-my-sm"/>
    <div :class="'q-pa-sm' + (!session.groupeId ? ' disabled' : '')">
      <div class="q-my-xs titre-md text-bold text-italic">
        {{session.groupeId ? $t('ACgr', [session.grC.na.nomc]) : $t('MLAngr')}}
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACaproposav')" />
        <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACsecrets')">
          <q-badge color="teal-10" rounded floating>{{nbgrsecs}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACmembres')">
          <q-badge color="teal-10" rounded floating>{{nbmbs}}</q-badge>
        </q-btn>
      </div>
    </div>
    <q-separator class="q-my-sm"/>

    <div class="row items-center q-pa-sm q-gutter-sm">
      <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACmesav')"
      @click="ui.setPage('compte')">
        <q-badge color="teal-10" rounded floating>{{nbtav}}</q-badge>
      </q-btn>
      <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACmesgr')">
        <q-badge color="teal-10" rounded floating>{{nbtgr}}</q-badge>
      </q-btn>
      <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACmesctc')">
        <q-badge color="teal-10" rounded floating>{{nbtct}}</q-badge>
      </q-btn>
      <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACmatribu')" />
      <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACmacompta')" />
    </div>
    <div class="full-width q-mt-sm column q-gutter-sm">
      <q-btn class="btn3" dense no-caps color="primary" :label="$t('ACmessecrets')" />
    </div>
    <q-separator class="q-my-sm"/>

    <div class="q-my-xs titre-md text-bold text-italic">{{$t('ACinfs', [session.tribu.na.nom])}}</div>
    <div v-if="session.estParrain" 
      class="q-my-xs titre-md text-bold text-italic text-warning">{{$t('ACcptspons')}}</div>
    <div class="q-mt-sm row items-center q-gutter-sm">
      <q-btn class="btn1" dense no-caps color="negative" :label="$t('ACdecnx')"
        @click="ui.dialoguedrc = true"/>
      <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACmasession')"
        @click="ui.setPage('session')" />
      <q-btn v-if="session.estComptable" class="btn1" dense no-caps color="primary" :label="$t('ACtribus')" />
    </div>
    <div :class="'q-mt-sm ' + (!session.accesIdb ? ' disabled' : '')" class="column q-gutter-sm">
      <div v-if="session.incognito" class="titre-md text-italic">{{$t('ACidb')}}</div>
      <q-btn class="btn3" dense no-caps color="primary" :label="$t('ACficav')" />
      <q-btn class="btn3" dense no-caps color="primary" :label="$t('ACtfloc')" />
    </div>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'

export default {
  name: 'PageAccueil',

  computed: {
    nbavsecs () { return 22 },
    nbgrsecs () { return 15 },
    nbmbs () { return 6 },
    nbgrps () { return 5 },
    nbspons () { return 1 },
    nbinvits () { return 0 },
    nbtav () { return 1 },
    nbtgr () { return 1 },
    nbtct () { return 1 },
    nbtsp () { return 1 },
    nbtiv () { return 1 }
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      ui: stores.ui,
      session: stores.session
    }
  }

}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn1
  text-align: center
  line-height: 0.8rem
  width: 7rem
  max-height: 1.3rem !important
  padding: 0.1rem !important
.btn3
  text-align: center
  line-height: 1.1rem
  width: 17rem
  padding: 0.1rem !important
</style>

