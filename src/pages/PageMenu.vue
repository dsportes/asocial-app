<template>
<q-list class="titre-md" style="min-width: 300px">
  <div v-if="bloc && !session.estComptable" 
    class="q-px-sm titre-md text-bold text-italic bg-yellow-5 text-warning cursor-pointer"
    @click="clickNotif2">{{$t('ACbloc')}}
  </div>

  <div v-if="!bloc">
    <q-item class="q-my-md" clickable @click="ui.setPage('notes')">
      <q-item-section>
        <q-item-label 
          class="titre-lg text-warning q-pa-xs bord9 text-bold text-center" 
          lines="1">{{$t('ACmesnotes')}}</q-item-label>
      </q-item-section>
    </q-item>
    <q-separator color="orange"/>
  </div>

  <q-item v-if="session.estComptable" clickable  @click="ui.setPage('espace')">
    <q-item-section>
      <q-item-label lines="1">{{$t('ACtribus')}}</q-item-label>
    </q-item-section>
  </q-item>

  <q-separator v-if="session.estComptable" color="orange"/>

  <div v-if="!bloc">
    <q-item clickable @click="ui.setPage('compte')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACmesav' + (session.estSponsor ? '1' : '2'))}}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable>
      <q-item-section clickable @click="ui.setPage('groupes')">
        <q-item-label lines="1">{{$t('ACmesgr')}}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable>
      <q-item-section clickable @click="ui.setPage('groupes')">
        <q-item-label lines="1">{{$t('ACmesinv')}}
          <q-badge color="primary" rounded>{{nbInvits}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="ui.setPage('people')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACmesctc')}}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="!aSt.compta.estA" clickable  @click="maTribu()">
      <q-item-section>
        <q-item-label lines="1">{{$t(pow <= 3 ? 'ACalloc' : 'ACspons')}}</q-item-label>
      </q-item-section>
    </q-item>
    <q-separator color="orange"/>

    <q-item class="row items-center">
      <span class="text-italic text-bold q-mr-sm">{{$t('ACav')}}</span>
      <q-select v-model="cav" borderless dense options-dense standard filled
          :options="options" style="max-width: 150px" behavior="menu"/>
    </q-item>

    <q-item clickable>
      <q-item-section class="q-ml-lg" clickable @click="MD.oD('detailsavatar')">
        <q-item-label lines="1">{{$t('ACdetav', [cav.label])}}
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
    <q-separator v-if="session.groupeId" class="q-my-xs" color="orange"/>

    <q-item v-if="session.groupeId" clickable @click="ui.setPage('groupe', 'groupe')">
      <span class="text-italic text-bold" style="position:relative;top:3px">{{$t('ACgr')}}</span>
      <q-btn class="q-ml-md text-bold" dense :label="gSt.egrC.groupe.na.nomc" no-caps
        icon-right="open_in_new" @click="ui.setPage('groupe', 'groupe')"/>
    </q-item>
    <q-item v-if="session.groupeId" clickable @click="ui.setPage('groupe', 'membres')">
      <q-item-section class="q-ml-lg">
        <q-item-label lines="1">{{$t('ACnotes')}}
        </q-item-label>
      </q-item-section>
    </q-item>
  </div>
</q-list>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'PageMenu',

  props: { menu: Boolean },

  computed: {
    nbchats () { return this.aSt.eavC.chats.size },
    nbspons () { return this.aSt.eavC.sponsorings.size },
    nbgrps () { 
      return this.aSt.compte.idGroupes(null, this.session.avatarId).size
    },
    nbInvits () { return this.gSt.nbInvits },

    nbgrsecs () { return '?' },
    nbmbs () { return '?' },

    nbtav () { return this.aSt.compta.mav.size },
    nbtgr () { return this.gSt.map.size },
    nbtct () { return this.pSt.map.size },
    nbttr () { return this.aSt.nbTribus },
    nbtsp () { return 1 },
    nbtiv () { return 1 },
    bloc () { return this.session.estMinimal },
  },

  watch: {
    cav (ap, av) {
      this.session.setAvatarId(ap.value)
    }
  },

  methods: {
    clickNotif2 () {
      this.ui.setPage('compta', 'chats')
    },
    maTribu () { 
      this.aSt.setTribuC()
      this.ui.setPage('tranche')
    },
  },

  data () {
    return {
    }
  },

  setup () {
    const aSt = stores.avatar
    const gSt = stores.groupe
    const session = stores.session
    const ui = stores.ui
    const options = ref([])
    const cav = ref(null)

    function lstAv () {
      aSt.map.forEach(e => {
        const a = e.avatar
        options.value.push({ label: a.na.nom, value: a.id })
      })
    } 

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setCompte' || name === 'setAvatar') {
          lstAv()
        }
      })
    })

    session.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatarId') {
          const id = args[0]
          options.value.forEach(x => { if (x.value === id) cav.value = x})
        }
      })
    })

    lstAv()
    options.value.forEach(x => { if (x.value === session.avatarId) cav.value = x})

    return {
      pow: session.pow,
      MD,
      aSt, session, gSt, ui,
      options, cav
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-item
  min-height: 20px !important
  padding: 3px 1rem !important
.bord9
  border: 2px solid $grey-5
  border-radius: 5px
</style>
