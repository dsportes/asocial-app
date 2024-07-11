<template>
<q-list v-if="session.status === 2" class="titre-md" style="min-width: 300px">
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
      <q-item-label lines="1">{{$t('ACpartitions')}}</q-item-label>
    </q-item-section>
  </q-item>

  <q-separator v-if="session.estComptable" color="orange"/>

  <div v-if="!bloc">
    <q-item clickable @click="ui.setPage('compte')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACmesav' + (session.estDelegue ? '1' : '2'))}}</q-item-label>
      </q-item-section>
    </q-item>

    <q-item clickable>
      <q-item-section clickable @click="ui.setPage('groupes')">
        <q-item-label>
          <span>{{$t('ACmesgr')}}
            <q-badge color="primary" rounded>{{nbgrpsT}}</q-badge>
          </span>
          <div class="q-ml-lg">
            <span>{{$t('ACmesinva')}}
              <q-badge :color="nbInvits ? 'warning' : 'primary'" rounded>{{nbInvits}}</q-badge>
            </span>
            <span class="q-ml-md">{{$t('ACmesinvc')}}
              <q-badge color="primary" rounded>{{nbContacts}}</q-badge>
            </span>
          </div>
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
    <q-item v-if="session.accesNet && !session.estA" clickable  @click="maPartition()">
      <q-item-section>
        <q-item-label lines="1">{{$t(session.pow <= 3 ? 'ACgpart' : 'ACdeleg')}}</q-item-label>
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

    <q-item v-if="session.groupeId" clickable @click="ui.setPage('groupe', 'groupe')">
      <span class="text-italic text-bold" style="position:relative;top:3px">{{$t('ACgr')}}</span>
      <q-btn class="q-ml-md text-bold" dense :label="nomg" no-caps
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
import stores from '../stores/stores.mjs'
import SelAvid from './SelAvid.vue'
import { GetPartition } from '../app/synchro.mjs'

export default {
  name: 'MenuAccueil',

  props: { menu: Boolean },

  components: { SelAvid },

  computed: {
    nbchats () { return this.aSt.nbchats },
    nbchatsAv () { const x = this.aSt.eavC; return x ? x.chats.size : 0 },
    nbspons () { const x = this.aSt.eavC; return x ? x.sponsorings.size : 0 },
    nbgrps () { return this.session.compte.idGroupes(this.session.avatarId).size },
    nbgrpsT () { return this.session.compte.idGroupes().size },
    nbInvits () { return this.gSt.invitsAtt.length },
    nbContacts () { return this.gSt.contactsAtt.length },
    bloc () { return this.session.estMinimal },
    nomg () { const idg = this.session.groupeid
      return idg ? this.session.getCV(idg).nom : ''
    }
  },

  watch: {
  },

  methods: {
    clickNotif2 () {
      this.ui.setPage('compta', 'chats')
    },
    async maPartition () { 
      await new GetPartition().run(this.session.compte.idp)
      this.ui.setPage('partition')
    },
    chatsAv () {
      this.fSt.filtre.chats.tous = false
      this.ui.setPage('chats')
    },
    tousChats () {
      this.fSt.filtre.chats.tous = true
      this.ui.setPage('chats')
    }
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      aSt: stores.avatar,
      gSt: stores.groupe,
      session: stores.session, 
      ui: stores.ui, 
      fSt: stores.filtre
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
